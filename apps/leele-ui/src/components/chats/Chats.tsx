import { useQuery } from 'urql'
import { graphql } from 'gql.tada'

const NotesQuery = graphql(`
  query ($channel: String!) {
    notes(channel: $channel) {
      id
      message
    }
  }
`)

type Props = {
  channel: string
}
export function Chats({ channel }: Props) {
  const [{ data, fetching, error }] = useQuery({
    query: NotesQuery,
    variables: {
      channel,
    },
  })

  if (fetching) return <p className='py-4 text-sm text-[#1a1a1a]/60'>Loading...</p>
  if (error) return <p className='py-4 text-sm text-[#1a1a1a]/60'>err... {error.message}</p>

  return (
    <section className='space-y-3'>
      <h2 className='text-sm font-medium tracking-tight text-[#1a1a1a]/70'>メッセージ</h2>
      <ul className='divide-y divide-[#bbb] overflow-hidden rounded-md border border-[#bbb] bg-white/40'>
        {data?.notes.map((note) => (
          <li key={note.id} className='px-4 py-3 text-sm text-[#1a1a1a]'>
            {note.message}
          </li>
        ))}
      </ul>
    </section>
  )
}
