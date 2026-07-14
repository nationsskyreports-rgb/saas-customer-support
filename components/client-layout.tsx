'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import { ThemeProvider } from '@/lib/theme-context'
import { Sidebar } from '@/components/sidebar'
import { TopNav } from '@/components/top-nav'
import { GlobalNotifications } from '@/components/global-notifications'
import { getAgent } from '@/lib/auth'

// Pages that don't need login and don't show the sidebar/topnav
const PUBLIC_PATHS = ['/login', '/customer-chat']

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <>
      <div style={{ height: '3px', backgroundColor: '#00B69B', width: '100%', position: 'fixed', top: 0, left: 0, zIndex: 60 }} />
      <Sidebar />
      <TopNav />
      <GlobalNotifications />
      <main
        className="transition-all duration-300 ease-in-out"
        style={{
          marginLeft: collapsed ? '60px' : '240px',
          marginTop: 'calc(3px + 4rem)',
        }}
      >
        {children}
      </main>
    </>
  )
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  useEffect(() => {
    if (isPublic) { setChecked(true); return }
    const agent = getAgent()
    if (!agent) {
      router.replace('/login')
    } else {
      setChecked(true)
    }
  }, [pathname, isPublic])

  // Public pages: no sidebar, no topnav, no guard
  if (isPublic) {
    return <ThemeProvider>{children}</ThemeProvider>
  }

  // Avoid flashing protected content before the auth check
  if (!checked) return null

  return (
    <ThemeProvider>
      <SidebarProvider>
        <LayoutInner>{children}</LayoutInner>
      </SidebarProvider>
    </ThemeProvider>
  )
}
