import { useQuery } from 'urql'
import { graphql } from 'gql.tada'

const NotesQuery = graphql(`
  query {
    notes {
      id
      message
    }
  }
`)

export function Chats() {
  const [{ data, fetching, error }] = useQuery({
    query: NotesQuery,
  })
  if (fetching) return <p>Loading...</p>
  if (error) return <p>err... {error.message}</p>

  return (
    <ul>
      {data?.notes.map((note) => (
        <li key={note.id}>{note.message}</li>
      ))}
    </ul>
  )
}
