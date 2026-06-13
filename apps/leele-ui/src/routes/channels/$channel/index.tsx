import { createFileRoute } from '@tanstack/react-router'
import { Chats } from '../../../components/chats/Chats'
import { ChatsSubscribe } from '../../../components/chats/ChatsSubscribe'
import { ChatCreate } from '../../../components/chats/ChatCreate'

export const Route = createFileRoute('/channels/$channel/')({
  component: Page,
})

export function Page() {
  const { channel } = Route.useParams()

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">
          #{channel}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <Chats channel={channel} />
        <ChatsSubscribe channel={channel} />
      </div>

      <footer className="border-t p-4">
        <ChatCreate channel={channel} />
      </footer>
    </div>
  )
}
