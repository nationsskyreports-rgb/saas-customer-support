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
  LogOut,
  TrendingUp,
  PhoneCall,
  Send,
  LayoutGrid,
  FileText,
  Eye,
  CircleDot,
  Package,
  Zap,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavSection {
  title: string
  items: Array<{ href: string; label: string; icon: React.ElementType }>
}

export function Sidebar() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['ANALYTICS', 'INBOX', 'ADMINISTRATION', 'CHANNELS', 'MESSAGES', 'REPORTS'])
  const pathname = usePathname()

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
        { href: '/inbox', label: 'All Conversations', icon: Clock },
        { href: '/monitoring', label: 'Monitoring', icon: Eye },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { href: '/agents', label: 'Agents', icon: Users },
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

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title)
        ? prev.filter((s) => s !== title)
        : [...prev, title]
    )
  }

  return (
    <div className="fixed left-0 h-screen w-60 bg-nos-gold text-white flex flex-col border-r border-white/10" style={{ backgroundColor: '#C0992F', top: '3px' }}>

      {/* Logo/Header */}
      <div className="flex items-center gap-2 p-4 border-b border-white/15">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-xs text-nos-gold">
          NO
        </div>
        <span className="font-semibold text-sm text-white">Nations Of Sky</span>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="px-2 py-2">
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-white uppercase opacity-60 hover:opacity-100 transition-opacity tracking-wider"
            >
              <span>{section.title}</span>
            </button>
            {expandedSections.includes(section.title) && (
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 text-sm font-medium',
                        isActive
                          ? 'bg-white/20 text-white border-l-3 border-white'
                          : 'text-white hover:bg-white/12'
                      )}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-white/15">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/15 transition-colors text-sm text-white">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
