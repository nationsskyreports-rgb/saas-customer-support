'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  MessageCircle,
  Users,
  Clock,
  LogOut,
  TrendingUp,
  PhoneCall,
  Send,
  LayoutGrid,
  Eye,
  CircleDot,
  Zap,
  Tag,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/sidebar-context'
import { useRouter } from 'next/navigation'
import { getAgent, clearAgent } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

interface NavSection {
  title: string
  items: Array<{ href: string; label: string; icon: React.ElementType }>
}

export function Sidebar() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['ANALYTICS', 'INBOX', 'ADMINISTRATION', 'CHANNELS', 'MESSAGES', 'REPORTS'])
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebar()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAdminRole, setIsAdminRole] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsAdminRole(getAgent()?.role === 'admin')
  }, [])

  const handleLogout = async () => {
    const agent = getAgent()
    if (agent) {
      await supabase.from('agents').update({ status: 'offline' }).eq('id', agent.id)
    }
    clearAgent()
    router.replace('/login')
  }

  // Listen for new-message events fired by GlobalNotifications — always count
  useEffect(() => {
    const handler = () => setUnreadCount(prev => prev + 1)
    window.addEventListener('nos-new-message', handler)
    return () => window.removeEventListener('nos-new-message', handler)
  }, [])

  const navSections: NavSection[] = [
    {
      title: 'ANALYTICS',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
      ],
    },
    {
      title: 'INBOX',
      items: [
        { href: '/inbox', label: 'My Chats', icon: MessageCircle },
        { href: '/my-resolved', label: 'My Resolved', icon: CircleDot },
        { href: '/inbox/all', label: 'All Conversations', icon: Clock },
        { href: '/monitoring', label: 'Monitoring', icon: Eye },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { href: '/agents', label: 'Agents', icon: Users },
        { href: '/roles', label: 'Terms & Roles', icon: Shield },
        { href: '/teams', label: 'Teams', icon: Users },
        { href: '/groups', label: 'Groups', icon: LayoutGrid },
        { href: '/agent-statuses', label: 'Agent Statuses', icon: CircleDot },
        { href: '/messages', label: 'Pre-defined Messages', icon: Zap },
        { href: '/log-categories', label: 'Log Category Types', icon: Tag },
      ],
    },
    {
      title: 'CHANNELS',
      items: [
        { href: '/channels', label: 'Meta Channels', icon: PhoneCall },
      ],
    },
    {
      title: 'MESSAGES',
      items: [
        { href: '/conversations', label: 'Conversations History', icon: Clock },
        { href: '/campaigns', label: 'Campaigns', icon: Send },
        { href: '/templates', label: 'Templates', icon: LayoutGrid },
      ],
    },
    {
      title: 'REPORTS',
      items: [
        { href: '/reports/overview', label: 'Overview Report', icon: BarChart3 },
        { href: '/reports/agent-performance', label: 'Agent Performance', icon: TrendingUp },
        { href: '/reports/chat-report', label: 'Chat Report', icon: MessageCircle },
        { href: '/reports/delivery-report', label: 'Delivery Report', icon: Send },
        { href: '/reports/activity-log', label: 'Activity Log', icon: Clock },
      ],
    },
  ]

  // Agents only see ANALYTICS + INBOX; admins see everything
  const ADMIN_ONLY = ['ADMINISTRATION', 'CHANNELS', 'MESSAGES', 'REPORTS']
  const visibleSections = navSections.filter(s => isAdminRole || !ADMIN_ONLY.includes(s.title))

  const toggleSection = (title: string) => {
    if (collapsed) return
    setExpandedSections((prev) =>
      prev.includes(title)
        ? prev.filter((s) => s !== title)
        : [...prev, title]
    )
  }

  return (
    <div
      className={cn(
        'fixed left-0 h-screen text-white flex flex-col border-r border-white/10 transition-all duration-300 ease-in-out z-40',
        collapsed ? 'w-[60px]' : 'w-60'
      )}
      style={{ background: 'linear-gradient(180deg, #00B69B 0%, #0E7A8F 55%, #1E5FA8 100%)', top: '3px' }}
    >
      {/* Logo/Header */}
      <div className={cn('flex items-center border-b border-white/15 p-4', collapsed ? 'justify-center' : 'gap-2.5')}>
        <img
          src="/logo-transparent.png"
          alt="Nations Of Sky"
          width={30}
          height={30}
          className="flex-shrink-0"
          style={{ objectFit: 'contain', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))' }}
        />
        {!collapsed && <span className="font-semibold text-sm text-white tracking-wide">Nations Of Sky</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        {visibleSections.map((section) => (
          <div key={section.title} className="px-2 py-1">
            {/* Section Title */}
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-white uppercase opacity-60 hover:opacity-100 transition-opacity tracking-wider"
              >
                <span>{section.title}</span>
              </button>
            )}

            {/* Collapsed: show a thin separator */}
            {collapsed && (
              <div className="mx-2 my-2 border-t border-white/20" />
            )}

            {/* Items */}
            {(collapsed || expandedSections.includes(section.title)) && (
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = item.href === '/inbox'
                    ? pathname === '/inbox'
                    : pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => { if (item.href === '/inbox') setUnreadCount(0) }}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center rounded-lg transition-colors duration-200 text-sm font-medium',
                        collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-4 py-2.5',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-white hover:bg-white/12'
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <Icon className="w-5 h-5" />
                        {item.href === '/inbox' && unreadCount > 0 && collapsed && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      {!collapsed && (
                        <span className="flex-1 flex items-center justify-between">
                          {item.label}
                          {item.href === '/inbox' && unreadCount > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Toggle Button */}
      <div className="p-2 border-t border-white/15">
        <button
          onClick={toggle}
          className={cn(
            'w-full flex items-center rounded-lg hover:bg-white/15 transition-colors text-sm text-white py-2.5',
            collapsed ? 'justify-center px-0' : 'gap-3 px-3'
          )}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* Logout */}
      <div className="p-2 border-t border-white/15">
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center rounded-lg hover:bg-white/15 transition-colors text-sm text-white py-2.5',
            collapsed ? 'justify-center px-0' : 'gap-3 px-3'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}
