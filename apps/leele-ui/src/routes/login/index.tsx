import { createFileRoute } from '@tanstack/react-router'
import { useAuth0 } from '@auth0/auth0-react'

export const Route = createFileRoute('/login/')({ component: Home })

function Home() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Login</h1>
      <button onClick={() => loginWithRedirect()}>a</button>
    </div>
  )
}
