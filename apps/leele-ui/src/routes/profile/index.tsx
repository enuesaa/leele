import { createFileRoute } from '@tanstack/react-router'
import { useAuth0 } from '@auth0/auth0-react'

export const Route = createFileRoute('/profile/')({
  component: Page,
})

export function Page() {
  const { user, isLoading, isAuthenticated } = useAuth0()

  if (isLoading) return <>Loading...</>

  if (!isAuthenticated) {
    return <>Not logged in</>
  }

  return (
    <div>
      <p>Name: {user?.name}</p>
      <p>Email: {user?.email}</p>
      <img src={user?.picture} alt={user?.name} />
    </div>
  )
}
