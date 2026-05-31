import { useCallback, useMemo, useRef } from 'react'
import { Client, Provider, cacheExchange, fetchExchange, subscriptionExchange } from 'urql'
import { authExchange } from '@urql/exchange-auth'
import { useAuth0 } from '@auth0/auth0-react'
import { AppSyncRealtimeClient } from '../lib/appsync-realtime'

const apiHost = new URL(import.meta.env.VITE_GRAPHQL_ENDPOINT).hostname

export function UrqlProvider({ children }: React.PropsWithChildren) {
  const auth0 = useAuth0()
  // Keep a ref so the memoised client always reads the latest auth0 instance.
  const auth0Ref = useRef(auth0)
  auth0Ref.current = auth0

  const getToken = useCallback(async () => {
    const claims = await auth0Ref.current.getIdTokenClaims()
    return claims?.__raw
  }, [])

  const client = useMemo(() => {
    const realtime = new AppSyncRealtimeClient({
      url: import.meta.env.VITE_GRAPHQL_REALTIME_ENDPOINT,
      apiHost,
      getToken,
    })

    return new Client({
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
            return {
              subscribe(sink) {
                const unsubscribe = realtime.subscribe(
                  { query: request.query ?? '', variables: request.variables },
                  sink,
                )
                return { unsubscribe }
              },
            }
          },
        }),
      ],
    })
  }, [getToken])

  return (
    <Provider value={client}>
      {children}
    </Provider>
  )
}
