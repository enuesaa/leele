import { useAuth0 } from '@auth0/auth0-react'

export function useAuth() {
  const {
    isLoading,
    isAuthenticated,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  } = useAuth0()

  return {
    isLoading,
    isAuthenticated,
    user,
    login: loginWithRedirect,
    logout() {
      logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      })
    },
    getAccessToken: getAccessTokenSilently,
  }
}
