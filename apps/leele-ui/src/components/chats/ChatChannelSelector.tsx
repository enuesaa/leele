import { useQuery } from 'urql'
import { graphql } from 'gql.tada'
import { Link } from '@tanstack/react-router'

const MetaQuery = graphql(`
  query {
    meta {
      channels
    }
  }
`)

export function ChatChannelSelector() {
  const [{ data, error }] = useQuery({
    query: MetaQuery,
  })

  return (
    <nav className='flex h-full flex-col gap-2 px-3 py-4'>
      <h2 className='px-2 text-xs font-semibold uppercase tracking-wider text-[#1a1a1a]/50'>
        Channels
      </h2>

      {error ? (
        <p className='px-2 text-sm text-[#1a1a1a]/50'>{error.message}</p>
      ) : (
        <ul className='space-y-0.5'>
          {data?.meta.channels.map((channel) => (
            <li key={channel}>
              <Link
                to='/channels/$channel'
                params={{ channel }}
                className='block rounded-md px-2 py-1.5 text-sm text-[#1a1a1a]/80 transition-colors hover:bg-[#1a1a1a]/6'
                activeProps={{
                  className: 'bg-[#1a1a1a]/10 font-medium text-[#1a1a1a]',
                }}
              >
                <span className='text-[#1a1a1a]/40'># </span>
                {channel}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
