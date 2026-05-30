import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className='py-12'>
      <Link to='/chats' className='text-[#1a1a1a] underline underline-offset-4 hover:opacity-70'>
        チャット
      </Link>
    </div>
  )
}
