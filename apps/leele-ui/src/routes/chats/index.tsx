import { createFileRoute, redirect } from '@tanstack/react-router'
import { Chats } from '../../components/chats/Chats'
import { ChatsSubscribe } from '../../components/chats/ChatsSubscribe'
import { ChatCreate } from '../../components/chats/ChatCreate'
import { useAuth0 } from '@auth0/auth0-react'

export const Route = createFileRoute('/chats/')({
  component: Page,
  // beforeLoad: async () => {
  //   const { isAuthenticated } = useAuth0()
  //   if (!isAuthenticated) {
  //     throw redirect({ to: '/' })
  //   }
  // },
})

function Page() {
  return (
    <div className='mx-auto max-w-2xl space-y-8'>
      <Chats />
      <ChatsSubscribe />
      <ChatCreate />
    </div>
  )
}
