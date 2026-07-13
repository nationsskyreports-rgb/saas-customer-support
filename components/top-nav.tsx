'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Settings, ChevronDown, LogOut, Moon, Sun } from 'lucide-react'
import { useSidebar } from '@/lib/sidebar-context'
import { useTheme } from '@/lib/theme-context'
import { getAgent, setAgent, clearAgent, AuthAgent } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export function TopNav() {
  const [statusOpen, setStatusOpen] = useState(false)
  const [agentStatus, setAgentStatus] = useState('Active')
  const [me, setMe] = useState<AuthAgent | null>(null)
  const { collapsed } = useSidebar()
  const { dark, toggleDark } = useTheme()
  const router = useRouter()

  const statuses = [
    { label: 'Active', value: 'online', color: 'bg-green-500' },
    { label: 'Busy', value: 'busy', color: 'bg-yellow-500' },
    { label: 'Away', value: 'away', color: 'bg-gray-400' },
    { label: 'Offline', value: 'offline', color: 'bg-red-500' },
  ]

  useEffect(() => {
    const agent = getAgent()
    if (!agent) return
    setMe(agent)
    // Read the REAL current status from the database (not the cached one)
    supabase
      .from('agents')
      .select('status')
      .eq('id', agent.id)
      .single()
      .then(({ data }) => {
        if (data?.status) {
          const s = statuses.find(x => x.value === data.status)
          if (s) setAgentStatus(s.label)
          setAgent({ ...agent, status: data.status })
        }
      })
  }, [])

  const getStatusColor = () => {
    const status = statuses.find(s => s.label === agentStatus)
    return status?.color || 'bg-green-500'
  }

  const changeStatus = async (status: { label: string; value: string }) => {
    setAgentStatus(status.label)
    setStatusOpen(false)
    localStorage.setItem('nos_last_status', status.value) // remembered for next login
    if (me) {
      await supabase.from('agents').update({ status: status.value }).eq('id', me.id)
      setAgent({ ...me, status: status.value })
    }
  }

  const signOut = async () => {
    if (me) {
      await supabase.from('agents').update({ status: 'offline' }).eq('id', me.id)
    }
    clearAgent()
    router.replace('/login')
  }

  const initials = me ? me.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'

  return (
    <>
      <div
        className="fixed right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40 transition-all duration-300 ease-in-out"
        style={{ top: '3px', left: collapsed ? '60px' : '240px' }}
      >
      {/* Left side */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDark}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={dark ? 'Light Mode' : 'Dark Mode'}
        >
          {dark ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Notifications">
          <Bell className="w-5 h-5 text-gray-700" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Settings">
          <Settings className="w-5 h-5 text-gray-700" />
        </button>

        {/* Agent Status Pill */}
        <div className="relative">
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <span className="text-sm font-medium text-gray-700">{agentStatus}</span>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          {statusOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-2">
                {statuses.map((status) => (
                  <button
                    key={status.label}
                    onClick={() => changeStatus(status)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition-colors text-sm text-gray-700"
                  >
                    <div className={`w-2 h-2 rounded-full ${status.color}`} />
                    <span>{status.label}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-200" />
              <div className="p-2">
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition-colors text-sm text-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Agent Avatar and Name */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div style={{ width: '36px', height: '36px', backgroundColor: '#C0992F', borderRadius: '50%' }} className="text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {initials}
          </div>
          <span className="text-sm font-medium text-gray-600">{me?.name || ''}</span>
        </div>
      </div>
      </div>
    </>
  )
}
