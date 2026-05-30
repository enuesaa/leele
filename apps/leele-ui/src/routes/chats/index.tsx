import { createFileRoute } from '@tanstack/react-router'
import { gql, useQuery } from 'urql'

export const Route = createFileRoute('/chats/')({ component: Home })

const NotesQuery = gql`
  query {
    notes {
      id
    }
  }
`;

function Home () {
  const [result, reexecuteQuery] = useQuery({
    query: NotesQuery,
  })
  const { data, fetching, error } = result;

  if (fetching) return <p>Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  return (
    <ul>
      {data.notes.map(note => (
        <li key={note.id}>{note.id}</li>
      ))}
    </ul>
  );
};