'use client'

import { useState } from 'react'
import { Bell, Settings, ChevronDown, LogOut } from 'lucide-react'

export function TopNav() {
  const [statusOpen, setStatusOpen] = useState(false)
  const [agentStatus, setAgentStatus] = useState('Active')

  const statuses = [
    { label: 'Active', color: 'bg-green-500' },
    { label: 'Busy', color: 'bg-yellow-500' },
    { label: 'Away', color: 'bg-gray-400' },
    { label: 'Offline', color: 'bg-red-500' },
  ]

  const getStatusColor = () => {
    const status = statuses.find(s => s.label === agentStatus)
    return status?.color || 'bg-green-500'
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-nos-gold z-50" />
      <div className="fixed top-0.5 left-60 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40">
      {/* Left side - Page title would go here */}
      <div className="flex-1" />

      {/* Right side - Actions */}
      <div className="flex items-center gap-6">
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

          {/* Dropdown Menu */}
          {statusOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-2">
                {statuses.map((status) => (
                  <button
                    key={status.label}
                    onClick={() => {
                      setAgentStatus(status.label)
                      setStatusOpen(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition-colors text-sm text-gray-700"
                  >
                    <div className={`w-2 h-2 rounded-full ${status.color}`} />
                    <span>{status.label}</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-200" />
              <div className="p-2">
                <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 transition-colors text-sm text-gray-700">
                  My Profile
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 transition-colors text-sm text-gray-700">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Agent Avatar and Name */}
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-nos-gold text-white font-semibold flex items-center justify-center text-sm">
            KR
          </div>
          <span className="text-sm font-medium text-gray-600">Kareem Rashad</span>
        </div>
      </div>
      </div>
    </>
  )
}
