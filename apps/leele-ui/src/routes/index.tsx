import { createFileRoute } from '@tanstack/react-router'
import { Amplify } from 'aws-amplify';
import { useAuth0 } from "@auth0/auth0-react";

// @ts-ignore
// import config from '../aws-exports.js'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { getIdTokenClaims } = useAuth0();

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault()
    const claims = await getIdTokenClaims()
    const idToken = claims?.__raw
    console.log(idToken);
  }

  return (
    <div className="p-8">
      <button onClick={handleClick}>b</button>
    </div>
  )
}
