import express from 'express'
import multer from 'multer'
import type { Server } from 'node:http'
import type { Plugin } from 'vite'

const DEFAULT_PORT = 4000
let server: Server | null = null
let signalsBound = false

const resolvePort = (port?: number) => port ?? (Number(process.env.EXPRESS_PORT) || DEFAULT_PORT)

export const startExpressServer = (port?: number) => {
  if (server) {
    return
  }

  const app = express()
  const listenPort = resolvePort(port)

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  const upload = multer({ storage: multer.memoryStorage() })

  app.post(
    '/api/upload',
    upload.single('file'),
    (req: express.Request & { file?: Express.Multer.File }, res) => {
      const file = req.file

      if (!file) {
        res.status(400).json({ error: 'missing file field "file"' })

        return
      }

      res.json({
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      })
    },
  )

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  server = app.listen(listenPort, () => {
    console.log(`[express] listening on http://localhost:${listenPort}`)
  })

  if (!signalsBound) {
    signalsBound = true
    const shutdown = () => stopExpressServer()
    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)
  }
}

export const stopExpressServer = () => {
  if (!server) {
    return
  }

  server.close(() => {
    console.log('[express] server stopped')
  })
  server = null
}

export const expressDevPlugin = (port?: number): Plugin => ({
  name: 'jsonforms-playground-express-server',
  apply: 'serve',
  configureServer(viteServer) {
    startExpressServer(port)
    viteServer.httpServer?.once('close', stopExpressServer)
  },
})
