import type { Editor, EditorEvents } from '@tiptap/core'
import { computed, ref, shallowRef, type Ref } from 'vue'
import { buildWysiwygAiRequest, resolveWysiwygAiTarget, type WysiwygAiTarget } from './context'
import { applyWysiwygAiOperation } from './operations'
import type { ResolvedWysiwygAiOptions } from './options'
import type { WysiwygAiAction, WysiwygAiOperation, WysiwygAiRequest } from './types'

export type WysiwygAiStatus = 'idle' | 'prompting' | 'generating' | 'done' | 'stopped' | 'error'

/**
 * How to apply the result:
 * - `replace`: replace the target (selection or current block);
 * - `insert`: insert at the cursor;
 * - `insertBelow`: insert after the block containing the target;
 * - `operations`: apply the structured operations returned by the backend.
 */
export type WysiwygAiAcceptMode = 'replace' | 'insert' | 'insertBelow' | 'operations'

export type UseWysiwygAiOptions = {
  getEditor: () => Editor | null | undefined
  options: Ref<ResolvedWysiwygAiOptions>
}

type TrackedTarget = {
  target: WysiwygAiTarget
  /** Set once any transaction changed the document after the request was built. */
  docChanged: boolean
  /** Set when the target range itself was deleted. */
  lost: boolean
}

const STALE_MESSAGE = 'Le texte ciblé a été modifié pendant la génération.'

const isAbortError = (error: unknown) =>
  error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')

/**
 * AI orchestration for one editor: request building, streaming into a detached
 * preview, abort / retry, and explicit acceptance. The document is never touched
 * before `accept()`.
 */
export const useWysiwygAi = ({ getEditor, options }: UseWysiwygAiOptions) => {
  const status = ref<WysiwygAiStatus>('idle')
  const currentAction = shallowRef<WysiwygAiAction | null>(null)
  const instruction = ref('')
  const result = ref('')
  const operations = shallowRef<WysiwygAiOperation[]>([])
  const explanation = ref('')
  const error = ref<string | null>(null)
  const lastRequest = shallowRef<WysiwygAiRequest | null>(null)
  const tracked = shallowRef<TrackedTarget | null>(null)

  let controller: AbortController | null = null
  let runId = 0
  let detachTracking: (() => void) | null = null

  const isGenerating = computed(() => status.value === 'generating')
  const isOpen = computed(() => status.value !== 'idle')
  const target = computed(() => tracked.value?.target ?? null)

  const canRun = () => {
    const editor = getEditor()
    return !!editor && !editor.isDestroyed && editor.isEditable && options.value.enabled
  }

  const stopTracking = () => {
    detachTracking?.()
    detachTracking = null
  }

  const track = (editor: Editor, initial: WysiwygAiTarget) => {
    stopTracking()
    const state: TrackedTarget = { target: { ...initial }, docChanged: false, lost: false }
    const onTransaction = ({ transaction }: EditorEvents['transaction']) => {
      if (!transaction.docChanged) return
      const { mapping } = transaction
      const from = mapping.mapResult(state.target.from, 1)
      const to = mapping.mapResult(state.target.to, -1)
      const blockEnd = mapping.mapResult(state.target.blockEnd, -1)
      state.docChanged = true
      if (state.target.kind !== 'cursor' && from.deleted && to.deleted) state.lost = true
      state.target = {
        ...state.target,
        from: from.pos,
        to: Math.max(from.pos, to.pos),
        blockEnd: blockEnd.pos,
      }
      tracked.value = { ...state }
    }
    editor.on('transaction', onTransaction)
    detachTracking = () => editor.off('transaction', onTransaction)
    tracked.value = { ...state }
  }

  const abort = () => {
    controller?.abort()
    controller = null
  }

  const reset = () => {
    result.value = ''
    operations.value = []
    explanation.value = ''
    error.value = null
  }

  const run = async (request: WysiwygAiRequest) => {
    const transport = options.value.transport
    if (!transport) return
    abort()
    reset()
    const id = ++runId
    const current = new AbortController()
    controller = current
    status.value = 'generating'
    lastRequest.value = request

    try {
      if (options.value.stream && typeof transport.stream === 'function') {
        for await (const chunk of transport.stream(request, { signal: current.signal })) {
          if (id !== runId || current.signal.aborted) return
          if (typeof chunk === 'string') result.value += chunk
          else if (chunk.type === 'text-delta') result.value += chunk.delta
          else if (chunk.type === 'error') throw new Error(chunk.errorText)
          else {
            operations.value = chunk.operations
            explanation.value = chunk.explanation ?? ''
          }
        }
      } else {
        const response = await transport.generate(request, { signal: current.signal })
        if (id !== runId || current.signal.aborted) return
        result.value = response.text ?? ''
        operations.value = response.operations ?? []
        explanation.value = response.explanation ?? ''
      }
      if (id === runId) status.value = 'done'
    } catch (err) {
      if (id !== runId) return
      if (current.signal.aborted || isAbortError(err)) {
        status.value = 'stopped'
        return
      }
      error.value = err instanceof Error && err.message ? err.message : String(err)
      status.value = 'error'
    } finally {
      if (controller === current) controller = null
    }
  }

  /** Opens an action: asks for an instruction first when the action needs one. */
  const open = (action: WysiwygAiAction) => {
    if (!canRun()) return
    if (action.promptForInstruction) {
      abort()
      reset()
      currentAction.value = action
      instruction.value = ''
      status.value = 'prompting'
      return
    }
    void start(action)
  }

  /** Builds the request from the current selection and starts generating. */
  const start = async (action: WysiwygAiAction, userInstruction?: string) => {
    const editor = getEditor()
    if (!editor || !canRun()) return
    currentAction.value = action
    if (userInstruction !== undefined) instruction.value = userInstruction
    const initial = resolveWysiwygAiTarget(editor, action)
    track(editor, initial)
    const cfg = options.value
    const request = buildWysiwygAiRequest(editor, action, initial, {
      instruction: instruction.value,
      maxContextCharacters: cfg.maxContextCharacters,
      includeHtml: cfg.includeHtml,
      includeJson: cfg.includeJson,
      format: cfg.format,
      metadata: cfg.metadata,
    })
    await run(request)
  }

  /** Replays the last request (same target and context). */
  const retry = async () => {
    if (!lastRequest.value || !canRun()) return
    await run(lastRequest.value)
  }

  /** Stops generating; the partial result stays available. */
  const cancel = () => {
    if (status.value !== 'generating') return
    runId++
    abort()
    status.value = 'stopped'
  }

  const discard = () => {
    runId++
    abort()
    stopTracking()
    reset()
    tracked.value = null
    currentAction.value = null
    lastRequest.value = null
    instruction.value = ''
    status.value = 'idle'
  }

  /** Writes the result into the document. Returns `true` when the document changed. */
  const accept = (mode: WysiwygAiAcceptMode): boolean => {
    const editor = getEditor()
    const state = tracked.value
    if (!editor || !state || !canRun()) return false
    if (status.value !== 'done' && status.value !== 'stopped') return false

    const { target: current } = state
    if (state.lost) {
      error.value = STALE_MESSAGE
      return false
    }
    if (state.docChanged && current.kind !== 'cursor' && mode === 'replace') {
      const text = editor.state.doc.textBetween(current.from, current.to, '\n\n', ' ')
      if (text !== current.text) {
        error.value = STALE_MESSAGE
        return false
      }
    }

    let applied = false
    if (mode === 'operations') {
      // Absolute positions are only valid against the document the backend saw.
      if (state.docChanged) {
        error.value = STALE_MESSAGE
        return false
      }
      const absolute = (op: WysiwygAiOperation) =>
        op.type === 'replaceText' ? op.from : op.type === 'insertContent' ? op.at : -1
      const ordered = [...operations.value].sort((a, b) => absolute(b) - absolute(a))
      for (const op of ordered) {
        // Tracking keeps the target mapped across the operations applied so far.
        const latest = tracked.value?.target ?? current
        applied = applyWysiwygAiOperation(editor, op, latest, options.value.format) || applied
      }
    } else {
      const content = result.value
      const type =
        mode === 'replace'
          ? 'replaceSelection'
          : mode === 'insert'
            ? 'insertAtCursor'
            : 'insertBelow'
      applied = applyWysiwygAiOperation(editor, { type, content }, current, options.value.format)
    }

    if (applied) discard()
    return applied
  }

  const dispose = () => discard()

  return {
    status,
    currentAction,
    instruction,
    result,
    operations,
    explanation,
    error,
    target,
    lastRequest,
    isGenerating,
    isOpen,
    open,
    start,
    retry,
    cancel,
    accept,
    discard,
    dispose,
  }
}

export type WysiwygAiController = ReturnType<typeof useWysiwygAi>
