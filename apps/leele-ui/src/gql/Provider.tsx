import { Client, Provider, cacheExchange, fetchExchange, subscriptionExchange } from 'urql'
import { authExchange } from '@urql/exchange-auth'
import { AppSyncSubscription } from '../gql/appsync'
import { useAuth } from '../auth/useAuth'

export function GqlProvider({ children }: React.PropsWithChildren) {
  const { getAccessToken } = useAuth()

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
            token = await getAccessToken()
          },
        }
      }),
      fetchExchange,
      subscriptionExchange({
        forwardSubscription: ({ query, variables }) => ({
          subscribe: (sink) => {
            const sub = new AppSyncSubscription(query, variables, getAccessToken)
            sub.connect(sink).catch(sink.error)
            
            return {
              unsubscribe: () => sub.disconnect(),
            }
          },
        }),
      }),
    ],
  })

  return <Provider value={client}>{children}</Provider>
}
