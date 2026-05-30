import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { AuthProvider } from '../components/AuthProvider'
import { UrqlProvider } from '../components/UrqlProvider'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'App' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: React.PropsWithChildren) {
  return (
    <html lang='ja'>
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthProvider>
          <UrqlProvider>
            {children}
          </UrqlProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  )
}
