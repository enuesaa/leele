import { createFileRoute } from '@tanstack/react-router'
import { useAuth0 } from '@auth0/auth0-react'
import { Client, cacheExchange, fetchExchange } from 'urql'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { getIdTokenClaims } = useAuth0()

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault()
    const claims = await getIdTokenClaims()
    const idToken = claims?.__raw
    if (idToken === undefined) {
      console.error('id token is undefined')
      return
    }

    const client = new Client({
      url: import.meta.env.VITE_GRAPHQL_ENDPOINT,
      exchanges: [cacheExchange, fetchExchange],
      fetchOptions: {
        headers: {
          Authorization: idToken,
        },
      },
    })
    const res = await client
      .query(
        `
      query {
        notes {
          id
        }
      }
    `,
        {},
      )
      .toPromise()
    console.log(res)
  }

  return (
    <div className='p-8'>
      <button onClick={handleClick}>b</button>
    </div>
  )
}
