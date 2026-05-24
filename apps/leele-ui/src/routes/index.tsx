import { createFileRoute } from '@tanstack/react-router'
import { Amplify } from 'aws-amplify';
// import { getCurrentUser, signInWithRedirect, signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { useAuth0 } from "@auth0/auth0-react";

// @ts-ignore
// import config from '../aws-exports.js'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  // const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
  //   e.preventDefault()
  //   Amplify.configure(config)

  //   // signInWithRedirect()
  // }
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="p-8">

      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      {/* <button onClick={handleClick}>login</button> */}
      <button onClick={() => loginWithRedirect()}>a</button>
    </div>
  )
}
