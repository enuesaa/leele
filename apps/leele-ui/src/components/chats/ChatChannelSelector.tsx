import { useQuery } from 'urql'
import { graphql } from 'gql.tada'
import { Link } from '@tanstack/react-router'

const MetaQuery = graphql(`
  query {
    meta {
      channels
    }
  }
`)

export function ChatChannelSelector() {
  const [{ data, fetching, error }] = useQuery({
    query: MetaQuery,
  })

  if (fetching) {
    return <p>Loading...</p>
  }

  if (error) {
    return <p>Err: {error.message}</p>
  }

  return (
    <nav>
      <h2 className="mb-2 text-sm font-medium">Channels</h2>

      <ul className="space-y-1">
        {data?.meta.channels.map((channel) => (
          <li key={channel}>
            <Link
              to="/channels/$channel"
              params={{ channel }}
              className="block rounded px-3 py-2 hover:bg-gray-100"
            >
              #{channel}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
