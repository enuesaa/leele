import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'urql'
import { graphql } from 'gql.tada'

export const Route = createFileRoute('/chats/')({ component: Home })

const NotesQuery = graphql(`
  query {
    notes {
      id
    }
  }
`)

function Home () {
  const [result, reexecuteQuery] = useQuery({
    query: NotesQuery,
  })
  const { data, fetching, error } = result;

  if (fetching) return <p>Loading...</p>;
  if (error) return <p>err... {error.message}</p>;

  return (
    <ul>
      {data?.notes.map(note => (
        <li key={note.id}>{note.id}</li>
      ))}
    </ul>
  );
};