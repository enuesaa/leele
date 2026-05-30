import { createFileRoute } from '@tanstack/react-router'
import { useAuth0 } from '@auth0/auth0-react'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { loginWithRedirect, getIdTokenClaims } = useAuth0()

  return (
    <div className='p-8'>
      <button onClick={() => loginWithRedirect()}>Login</button>
      <button onClick={async () => console.log(await getIdTokenClaims())}>check</button>
    </div>
  )
}
