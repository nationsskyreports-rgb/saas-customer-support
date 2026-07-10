'use client'

import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import { Sidebar } from '@/components/sidebar'
import { TopNav } from '@/components/top-nav'

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <>
      <div style={{ height: '3px', backgroundColor: '#C0992F', width: '100%', position: 'fixed', top: 0, left: 0, zIndex: 60 }} />
      <Sidebar />
      <TopNav />
      <main
        className="bg-gray-50 transition-all duration-300 ease-in-out"
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
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  )
}
