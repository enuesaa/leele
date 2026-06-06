import { createFileRoute } from '@tanstack/react-router'
import { Chats } from '../../components/chats/Chats'
import { ChatsSubscribe } from '../../components/chats/ChatsSubscribe'
import { ChatCreate } from '../../components/chats/ChatCreate'

export const Route = createFileRoute('/chats/')({ component: Page })

function Page() {
  return (
    <div className='mx-auto max-w-2xl space-y-8'>
      <Chats />
      <ChatsSubscribe />
      <ChatCreate />
    </div>
  )
}
