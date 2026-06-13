import { createFileRoute } from '@tanstack/react-router'
import { Profile } from '../../components/profile/Profile'

export const Route = createFileRoute('/profile/')({
  component: Page,
})

export function Page() {
  return <Profile />
}
