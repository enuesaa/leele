import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Page })

function Page() {
  return (
    <div className='py-12'>
    </div>
  )
}
