import { createFileRoute } from '@tanstack/react-router'
import { useSubscription } from 'urql'
import { graphql, type ResultOf } from 'gql.tada'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/chats/')({ component: Page })

const NoteCreatedSubscription = graphql(`
  subscription {
    onNoteCreated {
      id
      message
    }
  }
`)

type Note = NonNullable<ResultOf<typeof NoteCreatedSubscription>['onNoteCreated']>

function Page() {
  const [notes, setNotes] = useState<Note[]>([])
  const [{ data, fetching, error }] = useSubscription({
    query: NoteCreatedSubscription,
  })
  useEffect(() => {
    if (data === undefined || data.onNoteCreated === null) {
      return;
    }
    const note = data.onNoteCreated;
    setNotes((prev) => [...prev, note])
  }, [data])

  if (fetching) {
    return <p>Connecting...</p>
  }
  if (error !== undefined) {
    return <p>err... {error.message}</p>
  }
  return (
    <ul>
      {notes.map((note) => (
        <li key={note.id}>{note.message}</li>
      ))}
    </ul>
  )
}