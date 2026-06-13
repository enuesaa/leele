import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { AuthProvider } from '../auth/Provider'
import { GqlProvider } from '../gql/Provider'
import { Header } from '../components/common/Header'
import { NotFound } from '../components/common/NotFound'
import { ChatChannelSelector } from '../components/chats/ChatChannelSelector'

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
            <div className="flex h-screen">
              <aside className="w-64 shrink-0 border-r">
                <ChatChannelSelector />
              </aside>
              <main className="flex-1 overflow-hidden">
                {children}
              </main>
            </div>
          </GqlProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  )
}
