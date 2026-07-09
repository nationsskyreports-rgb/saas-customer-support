'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageCircle,
  BarChart3,
  Users,
  Clock,
  MessageSquare,
  ChevronLeft,
  Menu,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/inbox', label: 'Inbox', icon: MessageCircle },
    { href: '/agents', label: 'Agents', icon: Users },
    { href: '/conversations', label: 'Conversations', icon: Clock },
    { href: '/messages', label: 'Pre-defined Messages', icon: MessageSquare },
  ]

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 ease-out flex flex-col border-r border-sidebar-border',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo/Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-sidebar-accent-foreground" />
            </div>
            <span className="font-semibold text-sm">Support Hub</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-sidebar-accent/10 rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <Menu className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-2 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 text-sm',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/10'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent/10 transition-colors text-sm text-sidebar-foreground">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}
