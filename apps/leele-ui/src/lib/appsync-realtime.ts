export type AppSyncSink = {
  next: (value: { data?: Record<string, unknown> | null }) => void
  error: (error: unknown) => void
  complete: () => void
}

export type AppSyncOperation = {
  query: string
  variables?: Record<string, unknown>
}

export type AppSyncRealtimeOptions = {
  url: string
  apiHost: string
  getToken: () => Promise<string | undefined>
}

const WS_SUBPROTOCOL = 'graphql-ws'

export class AppSyncRealtimeClient {
  constructor(private readonly options: AppSyncRealtimeOptions) {}

  private async auth() {
    const token = await this.options.getToken()
    return { Authorization: token, host: this.options.apiHost }
  }

  subscribe(operation: AppSyncOperation, sink: AppSyncSink): () => void {
    const id = '1'
    let socket: WebSocket | null = null

    void (async () => {
      const auth = await this.auth()
      const header = btoa(JSON.stringify(auth))
      const payload = btoa(JSON.stringify({}))
      socket = new WebSocket(`${this.options.url}?header=${header}&payload=${payload}`, WS_SUBPROTOCOL)

      socket.addEventListener('open', () => {
        socket?.send(JSON.stringify({ type: 'connection_init' }))
      })

      socket.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data)
        switch (msg.type) {
          case 'connection_ack':
            socket?.send(JSON.stringify({
              id,
              type: 'start',
              payload: {
                data: JSON.stringify({ query: operation.query, variables: operation.variables ?? {} }),
                extensions: { authorization: auth },
              },
            }))
            return
          case 'data':
            sink.next(msg.payload)
            return
          case 'error':
            sink.error(msg.payload?.errors ?? msg.payload)
            return
          case 'complete':
            sink.complete()
            return
        }
      })

      socket.addEventListener('error', () => sink.error(new Error('AppSync WebSocket error')))
    })().catch((err) => sink.error(err))

    return () => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ id, type: 'stop' }))
      }
      socket?.close(1000)
    }
  }
}
