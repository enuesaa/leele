import { useQuery, useSubscription } from 'urql'
import { graphql, type ResultOf } from 'gql.tada'
import { useEffect, useMemo, useRef, useState } from 'react'

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
  const [{ data: sub }] = useSubscription({ query: NoteCreatedSubscription })

  useEffect(() => {
    if (sub === undefined || sub.onNoteCreated === null) return
    const note = sub.onNoteCreated
    setLive((prev) => (prev.some((n) => n.id === note.id) ? prev : [...prev, note]))
  }, [sub])

  // 古い → 新しい（新着が下）の順に並べる。初期取得分は新しい順で返るため反転する。
  const messages = useMemo(() => {
    const initial = [...(data?.notes ?? [])].reverse()
    const seen = new Set(initial.map((n) => n.id))
    return [...initial, ...live.filter((n) => !seen.has(n.id))]
  }, [data, live])

  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

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
          <li
            key={note.id}
            className='rounded-md px-3 py-1.5 text-sm text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a]/[0.04]'
          >
            {note.message}
          </li>
        ))}
      </ul>
      <div ref={bottomRef} />
    </div>
  )
}
