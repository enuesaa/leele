import { createFileRoute } from '@tanstack/react-router'
import { Chats } from '../../components/chats/Chats'
import { ChatsSubscribe } from '../../components/chats/ChatsSubscribe'
import { ChatCreate } from '../../components/chats/ChatCreate'

export const Route = createFileRoute('/channels/$channel')({
  component: Page,
})

function Page() {
  const { channel } = Route.useParams()

  return (
    <div className="py-12">
      <h1 className="mb-6 text-xl font-semibold">#{channel}</h1>

      <Chats channel={channel} />
      <ChatsSubscribe channel={channel} />
      <div className="mt-6">
        <ChatCreate channel={channel} />
      </div>
    </div>
  )
}