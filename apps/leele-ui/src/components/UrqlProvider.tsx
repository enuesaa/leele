import { Client, Provider, cacheExchange, fetchExchange, subscriptionExchange } from 'urql'
import { authExchange } from '@urql/exchange-auth'
import { useAuth0 } from '@auth0/auth0-react'
import { createClient as createWsClient } from 'graphql-ws'

const apiHost = new URL(import.meta.env.VITE_GRAPHQL_ENDPOINT).hostname

function createAppSyncWebSocket(getToken: () => Promise<string | undefined>) {
  return class extends WebSocket {
    constructor(url: string | URL, _protocols?: string | string[]) {
      super(url, 'graphql-ws')

      const originalSend = this.send.bind(this)
      this.send = (data: string) => {
        const parsed = JSON.parse(data)
        if (parsed.type === 'subscribe') {
          getToken().then((token) => {
            originalSend(JSON.stringify({
              id: parsed.id,
              payload: {
                data: JSON.stringify({
                  query: parsed.payload.query,
                  // variables: parsed.payload.variables ?? {},
                }),
                extensions: {
                  authorization: {
                    Authorization: token,
                    host: apiHost,
                  },
                },
              },
              type: 'start',
            }))
          })
        } else if (parsed.type === 'complete') {
          originalSend(JSON.stringify({ ...parsed, type: 'stop' }))
        } else {
          originalSend(data)
        }
      }

      this.addEventListener('message', (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'data') {
          Object.defineProperty(event, 'data', {
            value: JSON.stringify({ ...data, type: 'next' }),
          })
        }
      })
    }
  }
}

export function UrqlProvider({ children }: React.PropsWithChildren) {
  const { getIdTokenClaims } = useAuth0()

  const getToken = async () => {
    const claims = await getIdTokenClaims()
    return claims?.__raw
  }

  const wsClient = createWsClient({
    url: async () => {
      const token = await getToken()
      const header = btoa(JSON.stringify({ Authorization: token, host: apiHost }))
      const payload = btoa(JSON.stringify({}))
      return `${import.meta.env.VITE_GRAPHQL_REALTIME_ENDPOINT}?header=${header}&payload=${payload}`
    },
    webSocketImpl: createAppSyncWebSocket(getToken),
  })

  const client = new Client({
    url: import.meta.env.VITE_GRAPHQL_ENDPOINT,
    exchanges: [
      cacheExchange,
      authExchange(async (utils) => {
        let token: string|undefined = undefined
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
            return error.graphQLErrors.some(
              (e) => e.extensions?.code === 'UNAUTHENTICATED',
            )
          },
          async refreshAuth() {
            token = await getToken()
          },
        }
      }),
      fetchExchange,
      subscriptionExchange({
        forwardSubscription(request) {
          const input = { ...request, query: request.query ?? '' }
          return {
            subscribe(sink) {
              return { unsubscribe: wsClient.subscribe(input, sink) }
            },
          }
        },
      }),
    ],
  })

  return (
    <Provider value={client}>
      {children}
    </Provider>
  )
}