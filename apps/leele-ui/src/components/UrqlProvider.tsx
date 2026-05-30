import { Client, Provider, cacheExchange, fetchExchange } from 'urql'
import { authExchange } from '@urql/exchange-auth'
import { useAuth0 } from '@auth0/auth0-react'

export function UrqlProvider({ children }: React.PropsWithChildren) {
  const { getIdTokenClaims } = useAuth0()

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
    ],
  })
  
  return (
    <Provider value={client}>
      {children}
    </Provider>
  )
}
