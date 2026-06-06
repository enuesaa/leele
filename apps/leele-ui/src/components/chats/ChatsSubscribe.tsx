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
    return <p className='py-4 text-sm text-[#1a1a1a]/60'>Connecting...</p>
  }
  if (error !== undefined) {
    return <p className='py-4 text-sm text-[#1a1a1a]/60'>err... {error.message}</p>
  }
  return (
    <section className='space-y-3'>
      <h2 className='flex items-center gap-2 text-sm font-medium tracking-tight text-[#1a1a1a]/70'>
        <span className='inline-block h-1.5 w-1.5 rounded-full bg-[#1a1a1a]/50' />
        リアルタイム
      </h2>
      {notes.length === 0 ? (
        <p className='rounded-md border border-dashed border-[#bbb] px-4 py-3 text-sm text-[#1a1a1a]/50'>
          新しいメッセージを待っています…
        </p>
      ) : (
        <ul className='divide-y divide-[#bbb] overflow-hidden rounded-md border border-[#bbb] bg-white/40'>
          {notes.map((note) => (
            <li key={note.id} className='px-4 py-3 text-sm text-[#1a1a1a]'>
              {note.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
