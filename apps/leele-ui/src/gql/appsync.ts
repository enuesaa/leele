import { subscriptionExchange } from 'urql'

type ForwardSubscription = Parameters<typeof subscriptionExchange>[0]['forwardSubscription']
type SubscribeArgs = Parameters<ReturnType<ForwardSubscription>['subscribe']>
type Sink = SubscribeArgs[0]

export class AppSyncSubscription {
  private socket: WebSocket | null = null

  constructor(
    private query: string | undefined,
    private variables: Record<string, unknown> | undefined,
    private getToken: () => Promise<string | undefined>,
  ) {}

  async connect(sink: Sink) {
    const auth = {
      Authorization: await this.getToken(),
      host: new URL(import.meta.env.VITE_GRAPHQL_ENDPOINT).hostname,
    }
    const header = btoa(JSON.stringify(auth))
    const wsurl = `${import.meta.env.VITE_GRAPHQL_REALTIME_ENDPOINT}?header=${header}&payload=${btoa('{}')}`
    this.socket = new WebSocket(wsurl, 'graphql-ws')

    this.socket.addEventListener('open', () => {
      this.socket?.send(JSON.stringify({ type: 'connection_init' }))
    })
    this.socket.addEventListener('error', () => {
      sink.error('WebSocket error')
    })
    this.socket.addEventListener('message', ({ data }) => {
      const msg = JSON.parse(data)
      if (msg.type === 'connection_ack') {
        this.socket?.send(
          JSON.stringify({
            id: '1',
            type: 'start',
            payload: {
              data: JSON.stringify({ query: this.query, variables: this.variables ?? {} }),
              extensions: { authorization: auth },
            },
          }),
        )
      } else if (msg.type === 'data') {
        sink.next(msg.payload)
      } else if (msg.type === 'error') {
        sink.error(msg.payload?.errors ?? msg.payload)
      } else if (msg.type === 'complete') {
        sink.complete()
      }
    })
  }

  disconnect() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ id: '1', type: 'stop' }))
    }
    this.socket?.close(1000)
  }
}