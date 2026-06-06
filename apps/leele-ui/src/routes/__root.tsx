import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { AuthProvider } from '../components/AuthProvider'
import { GqlProvider } from '../gql/Provider'
import { Header } from '../components/Header'
import { NotFound } from '../components/NotFound'

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
  notFoundComponent: NotFound,
})

function RootDocument({ children }: React.PropsWithChildren) {
  return (
    <html lang='ja'>
      <head>
        <HeadContent />
      </head>
      <body className='min-h-full bg-[#ccc] text-[#1a1a1a] antialiased'>
        <AuthProvider>
          <GqlProvider>
            <Header />
            <main className='mx-auto max-w-5xl px-6 py-10'>{children}</main>
          </GqlProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  )
}
