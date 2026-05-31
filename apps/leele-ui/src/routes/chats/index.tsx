import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useSubscription } from 'urql'
import { graphql } from 'gql.tada'
import { useEffect } from 'react'

export const Route = createFileRoute('/chats/')({ component: Home })

const NotesQuery = graphql(`
  query {
    notes {
      id
      message
    }
  }
`)

const CreateNoteMutation = graphql(`
  mutation ($message: String!) {
    createNote(message: $message) {
      id
      message
    }
  }
`)

const NoteCreatedSubscription = graphql(`
  subscription {
    noteCreated {
      id
      message
    }
  }
`)

type Note = { id: string; message: string }

function Home () {
  const [result] = useQuery({
    query: NotesQuery,
  })
  const { data, fetching, error } = result;

  const [subscriptionResult] = useSubscription(
    { query: NoteCreatedSubscription },
    (notes: Note[] = [], response) => {
      const note = response.noteCreated;
      if (notes.some(n => n.id === note.id)) return notes;
      return [...notes, note];
    },
  );
  useEffect(() => {
    console.log(subscriptionResult.data)
  }, [subscriptionResult.data])

  const [createResult, createNote] = useMutation(CreateNoteMutation);

  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const message = formData.get('message')?.toString().trim();
    if (!message) return;
  
    const res = await createNote({ message });
    if (!res.error) {
      e.currentTarget.reset();
    }
  };

  if (fetching) return <p>Loading...</p>;
  if (error) return <p>err... {error.message}</p>;

  return (
    <div>
      <ul>
        {data?.notes.map(note => (
          <li key={note.id}>{note.message}</li>
        ))}
      </ul>

      <form onSubmit={handleSubmit}>
        <input type="text" name='message' placeholder="メッセージを入力" />
        <button type="submit" disabled={createResult.fetching}>
          送信
        </button>
      </form>
      {createResult.error && <p>送信エラー: {createResult.error.message}</p>}
    </div>
  );
};
