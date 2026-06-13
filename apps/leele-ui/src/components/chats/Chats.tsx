import { useQuery, useSubscription } from 'urql'
import { graphql, type ResultOf } from 'gql.tada'
import { useEffect, useMemo, useState } from 'react'

const NotesQuery = graphql(`
  query ($channel: String!) {
    notes(channel: $channel) {
      id
      message
    }
  }
`)

const NoteCreatedSubscription = graphql(`
  subscription {
    onNoteCreated {
      id
      message
      channel
    }
  }
`)

type Note = NonNullable<ResultOf<typeof NoteCreatedSubscription>['onNoteCreated']>

type Props = {
  channel: string
}
export function Chats({ channel }: Props) {
  const [{ data, error }] = useQuery({
    query: NotesQuery,
    variables: { channel },
  })

  const [live, setLive] = useState<Note[]>([])
  const [{ data: sub }] = useSubscription({
    query: NoteCreatedSubscription,
  })

  useEffect(() => {
    if (sub === undefined || sub.onNoteCreated === null) return
    const note = sub.onNoteCreated
    if (note.channel === channel) {
      setLive((prev) => (prev.some((n) => n.id === note.id) ? prev : [...prev, note]))
    }
  }, [sub])

  const messages = useMemo(() => {
    const initial = [...(data?.notes ?? [])].reverse()
    const seen = new Set(initial.map((n) => n.id))
    return [...initial, ...live.filter((n) => !seen.has(n.id))]
  }, [data, live])

  if (error) {
    return (
      <div className='flex flex-1 items-center justify-center text-sm text-[#1a1a1a]/50'>
        {error.message}
      </div>
    )
  }
  if (messages.length === 0) {
    return (
      <div className='flex flex-1 items-center justify-center text-sm text-[#1a1a1a]/40'>
        まだメッセージはありません
      </div>
    )
  }

  return (
    <div className='flex flex-1 flex-col justify-end overflow-y-auto px-6 py-4'>
      <ul className='space-y-1'>
        {messages.map((note) => (
          <li key={note.id} className='rounded-md px-3 py-1.5 text-sm text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a]/4'>
            {note.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
