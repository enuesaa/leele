import { Link } from '@tanstack/react-router'
import { useAuth0 } from '@auth0/auth0-react'

export function Header() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0()

  return (
    <header className='sticky top-0 z-10 border-b border-[#ccc] bg-[#ccc]/80 backdrop-blur-sm'>
      <div className='mx-auto flex h-14 max-w-5xl items-center justify-between px-6'>
        <Link to='/' className='text-lg font-medium tracking-tight text-[#1a1a1a] transition-colors hover:opacity-70'>
          leele
        </Link>

        {!isLoading &&
          (isAuthenticated ? (
            <button
              type='button'
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className='rounded-md border border-[#bbb] px-3 py-1.5 text-sm text-[#1a1a1a] transition-colors hover:bg-[#bbb]'
            >
              ログアウト
            </button>
          ) : (
            <button
              type='button'
              onClick={() => loginWithRedirect()}
              className='rounded-md border border-[#bbb] px-3 py-1.5 text-sm text-[#1a1a1a] transition-colors hover:bg-[#bbb]'
            >
              ログイン
            </button>
          ))}
      </div>
    </header>
  )
}
