import { createFileRoute } from '@tanstack/react-router'
import { Amplify } from 'aws-amplify';
import { useAuth0 } from "@auth0/auth0-react";

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { getIdTokenClaims } = useAuth0();

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault()
    const claims = await getIdTokenClaims()
    const idToken = claims?.__raw
    console.log(idToken);

    Amplify.configure({
      API: {
        GraphQL: {
          endpoint: import.meta.env.VITE_GRAPHQL_ENDPOINT,
          region: import.meta.env.VITE_GRAPHQL_REGION,
          defaultAuthMode: 'oidc',
        },
      },
    })
  }

  return (
    <div className="p-8">
      <button onClick={handleClick}>b</button>
    </div>
  )
}
