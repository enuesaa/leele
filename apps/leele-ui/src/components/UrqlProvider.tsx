import { Client, Provider, cacheExchange, fetchExchange, subscriptionExchange } from 'urql'
import { authExchange } from '@urql/exchange-auth'
import { useAuth0 } from '@auth0/auth0-react'
import { createClient as createWSClient } from 'graphql-ws'
import { SubscriptionClient } from 'subscriptions-transport-ws';

const subscriptionClient = new SubscriptionClient(import.meta.env.VITE_GRAPHQL_REALTIME_ENDPOINT, {
  // reconnect: true,
})

export function UrqlProvider({ children }: React.PropsWithChildren) {
  const { getIdTokenClaims } = useAuth0()

  // const wsClient = createWSClient({
  //   url: import.meta.env.VITE_GRAPHQL_REALTIME_ENDPOINT,
  //   connectionParams: async () => {
  //     const claims = await getIdTokenClaims()
  //     const token = claims?.__raw
  //     return token ? { Authorization: `Bearer ${token}` } : {}
  //   },
  // })


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
            const claims = await getIdTokenClaims()
            token = claims?.__raw
          },
        }
      }),
      fetchExchange,
      // subscriptionExchange({
      //   forwardSubscription(request) {
      //     const input = { ...request, query: request.query || '' }
      //     return {
      //       subscribe(sink) {
      //         const unsubscribe = wsClient.subscribe(input, sink)
      //         return { unsubscribe }
      //       },
      //     }
      //   },
      // }),
      subscriptionExchange({
        forwardSubscription: request => subscriptionClient.request(request),
      }),
    ],
  })
  
  return (
    <Provider value={client}>
      {children}
    </Provider>
  )
}
