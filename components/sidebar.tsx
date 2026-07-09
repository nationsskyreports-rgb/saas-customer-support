'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  MessageCircle,
  Users,
  Clock,
  MessageSquare,
  ChevronLeft,
  Menu,
  LogOut,
  TrendingUp,
  Settings,
  Zap,
  PhoneCall,
  Send,
  LayoutGrid,
  FileText,
  Eye,
  UserCheck,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavSection {
  title: string
  items: Array<{ href: string; label: string; icon: React.ElementType }>
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['analytics', 'inbox', 'admin'])
  const pathname = usePathname()

  const navSections: NavSection[] = [
    {
      title: 'Analytics',
      items: [
        { href: '/dashboard', label: 'Overview', icon: BarChart3 },
        { href: '/monitoring', label: 'Monitoring', icon: Eye },
        { href: '/reports', label: 'Reports', icon: TrendingUp },
      ],
    },
    {
      title: 'Inbox',
      items: [
        { href: '/inbox', label: 'Conversations', icon: MessageCircle },
        { href: '/conversations', label: 'History', icon: Clock },
      ],
    },
    {
      title: 'Administration',
      items: [
        { href: '/agents', label: 'Agents', icon: Users },
        { href: '/agent-statuses', label: 'Agent Statuses', icon: UserCheck },
        { href: '/teams', label: 'Teams', icon: Package },
        { href: '/groups', label: 'Groups', icon: Users },
      ],
    },
    {
      title: 'Channels',
      items: [
        { href: '/channels', label: 'Meta Channels', icon: PhoneCall },
      ],
    },
    {
      title: 'Messages',
      items: [
        { href: '/templates', label: 'Templates', icon: MessageSquare },
        { href: '/campaigns', label: 'Campaigns', icon: Send },
        { href: '/messages', label: 'Pre-defined', icon: Zap },
      ],
    },
    {
      title: 'Settings',
      items: [
        { href: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ]

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title)
        ? prev.filter((s) => s !== title)
        : [...prev, title]
    )
  }

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 ease-out flex flex-col border-r border-sidebar-border',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo/Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center font-bold text-xs">
              NO
            </div>
            <span className="font-semibold text-sm">Nations Of Sky</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center font-bold text-xs">
            NO
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

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="px-2 py-2">
            {!isCollapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
              >
                <span>{section.title}</span>
              </button>
            )}
            {(isCollapsed || expandedSections.includes(section.title)) && (
              <div className="space-y-1">
                {section.items.map((item) => {
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
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent/10 transition-colors text-sm text-sidebar-foreground" title={isCollapsed ? 'Logout' : undefined}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}
