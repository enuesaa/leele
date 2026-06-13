import { createFileRoute } from '@tanstack/react-router'
import { Chats } from '../../../components/chats/Chats'
import { ChatCreate } from '../../../components/chats/ChatCreate'

export const Route = createFileRoute('/channels/$channel/')({
  component: Page,
})

export function Page() {
  const { channel } = Route.useParams()

  return (
    <div className='flex h-full flex-col'>
      <header className='shrink-0 border-b border-[#bbb] px-6 py-3'>
        <h1 className='text-base font-semibold tracking-tight text-[#1a1a1a]'>
          # {channel}
        </h1>
      </header>

      <Chats key={channel} channel={channel} />

      <footer className='shrink-0 border-t border-[#bbb] px-6 py-3'>
        <ChatCreate channel={channel} />
      </footer>
    </div>
  )
}
