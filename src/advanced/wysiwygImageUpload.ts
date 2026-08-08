import { Node, mergeAttributes, type CommandProps, type NodeViewRenderer } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import type { Editor } from '@tiptap/vue-3'
import type { InjectionKey, Ref } from 'vue'
import WysiwygImageUploadNode from './WysiwygImageUploadNode.vue'

export type WysiwygImageUploadContext = {
  /** Resolve a public URL (or data URL) for the selected file. */
  upload: (file: File) => Promise<string>
  accept: string
  label: string
  description: string
  maxSize?: number
}

export const WysiwygImageUploadKey: InjectionKey<Ref<WysiwygImageUploadContext>> =
  Symbol('wysiwygImageUpload')

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUpload: {
      insertImageUpload: () => ReturnType
    }
  }
}

/**
 * TipTap placeholder node that renders a Nuxt UI file dropzone, then swaps itself
 * for a real `image` node once the file is resolved.
 */
export const ImageUpload = Node.create({
  name: 'imageUpload',
  group: 'block',
  atom: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="image-upload"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-upload' })]
  },

  addNodeView(): NodeViewRenderer {
    return VueNodeViewRenderer(WysiwygImageUploadNode)
  },

  addCommands() {
    return {
      insertImageUpload:
        () =>
        ({ commands }: CommandProps) =>
          commands.insertContent({ type: this.name }),
    }
  },
})

export const imageUploadHandler = {
  canExecute: (editor: Editor) => editor.can().insertContent({ type: 'imageUpload' }),
  execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'imageUpload' }),
  isActive: (editor: Editor) => editor.isActive('imageUpload'),
  isDisabled: undefined as undefined,
}

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') resolve(result)
      else reject(new Error('Impossible de lire le fichier image'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Lecture du fichier impossible'))
    reader.readAsDataURL(file)
  })
