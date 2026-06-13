import { useAuth0 } from '@auth0/auth0-react'

export function Profile() {
  const { user, isLoading, isAuthenticated, logout } = useAuth0()

  const handleLogout: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    logout({ logoutParams: { returnTo: window.location.origin }})
  }

  if (isLoading) {
    return <div className='mx-auto max-w-5xl px-6 py-10 text-[#1a1a1a]'>Loading...</div>
  }
  if (!isAuthenticated) {
    return <div className='mx-auto max-w-5xl px-6 py-10 text-[#1a1a1a]'>Not logged in</div>
  }

  return (
    <div className='mx-auto max-w-5xl px-6 py-10'>
      <div className='flex flex-col items-center gap-6 rounded-2xl border border-[#ccc] bg-white/30 p-8'>
        {user?.picture && (
          <img src={user.picture} className='h-24 w-24 rounded-full border border-[#ccc] object-cover' />
        )}
        <div className='flex flex-col items-center gap-1 text-center'>
          <p className='text-xl font-medium tracking-tight text-[#1a1a1a]'>{user?.name}</p>
          <p className='text-sm text-[#666]'>{user?.email}</p>
        </div>
        <button type='button' onClick={handleLogout} className='rounded-md border border-[#bbb] px-4 py-2 text-sm text-[#1a1a1a] transition-colors hover:bg-[#bbb]'>
          ログアウト
        </button>
      </div>
    </div>
  )
}