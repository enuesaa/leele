import { useSubscription } from 'urql'
import { graphql, type ResultOf } from 'gql.tada'
import { useEffect, useState } from 'react'

const NoteCreatedSubscription = graphql(`
  subscription {
    onNoteCreated {
      id
      message
    }
  }
`)

type Note = NonNullable<ResultOf<typeof NoteCreatedSubscription>['onNoteCreated']>

export function ChatsSubscribe() {
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