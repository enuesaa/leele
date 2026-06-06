import { createFileRoute } from '@tanstack/react-router'
import { useSubscription } from 'urql'
import { graphql } from 'gql.tada'

export const Route = createFileRoute('/chats/')({ component: Page })

const NoteCreatedSubscription = graphql(`
  subscription {
    noteCreated {
      id
      message
    }
  }
`)

type Note = { id: string; message: string }

function Page() {
  const [{ data, fetching, error }] = useSubscription({ query: NoteCreatedSubscription }, (notes: (Note|null)[] = [], response) => {
    notes.push(response.noteCreated)
    return notes.filter(n => n !== null)
  })

  if (fetching) return <p>Loading...</p>
  if (error) return <p>err... {error.message}</p>

  return (
    <ul>
      {data?.map((note) => (
        <li key={note?.id}>{note?.message}</li>
      ))}
    </ul>
  )
}
