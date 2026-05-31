import { Client, Provider, cacheExchange, fetchExchange, subscriptionExchange } from 'urql'
import { authExchange } from '@urql/exchange-auth'
import { useAuth0 } from '@auth0/auth0-react'

export function UrqlProvider({ children }: React.PropsWithChildren) {
  const { getIdTokenClaims } = useAuth0()

  const getToken = async () => {
    const claims = await getIdTokenClaims()
    return claims?.__raw
  }

  const client = new Client({
    url: import.meta.env.VITE_GRAPHQL_ENDPOINT,
    exchanges: [
      cacheExchange,
      authExchange(async (utils) => {
        let token: string | undefined = undefined
        return {
          addAuthToOperation(operation) {
            if (!token) {
              return operation
            }
            return utils.appendHeaders(operation, {
              Authorization: `Bearer ${token}`,
            })
          },
          willAuthError() {
            return !token
          },
          didAuthError(error) {
            return error.graphQLErrors.some((e) => e.extensions?.code === 'UNAUTHENTICATED')
          },
          async refreshAuth() {
            token = await getToken()
          },
        }
      }),
      fetchExchange,
      subscriptionExchange({
        forwardSubscription: ({ query, variables }) => ({
          subscribe: (sink) => {
            let socket: WebSocket | null = null

            ;(async () => {
              const auth = {
                Authorization: await getToken(),
                host: new URL(import.meta.env.VITE_GRAPHQL_ENDPOINT).hostname,
              }
              const header = btoa(JSON.stringify(auth))
              socket = new WebSocket(
                `${import.meta.env.VITE_GRAPHQL_REALTIME_ENDPOINT}?header=${header}&payload=${btoa('{}')}`,
                'graphql-ws',
              )

              socket.addEventListener('open', () => {
                socket?.send(JSON.stringify({ type: 'connection_init' }))
              })
              socket.addEventListener('error', () => {
                sink.error('WebSocket error')
              })
              socket.addEventListener('message', ({ data }) => {
                const msg = JSON.parse(data)
                if (msg.type === 'connection_ack') {
                  socket?.send(
                    JSON.stringify({
                      id: '1',
                      type: 'start',
                      payload: {
                        data: JSON.stringify({ query, variables: variables ?? {} }),
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
            })().catch(sink.error)

            return {
              unsubscribe: () => {
                if (socket?.readyState === WebSocket.OPEN) {
                  socket?.send(JSON.stringify({ id: '1', type: 'stop' }))
                }
                socket?.close(1000)
              },
            }
          },
        }),
      }),
    ],
  })

  return <Provider value={client}>{children}</Provider>
}
