import { createFileRoute } from '@tanstack/react-router'
import { Chats } from '../components/chats/Chats'
import { ChatsSubscribe } from '../components/chats/ChatsSubscribe'
import { ChatCreate } from '../components/chats/ChatCreate'

export const Route = createFileRoute('/')({ component: Page })

function Page() {
  return (
    <div className='py-12'>
      <Chats />
      <ChatsSubscribe />
      <ChatCreate />
    </div>
  )
}
