'use client'

import { Bell, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TopNav() {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-nos-gold z-50" />
      <div className="fixed top-0.5 left-60 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40 transition-all duration-300">
      {/* Left side - Page title would go here */}
      <div className="flex-1" />

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Notifications">
          <Bell className="w-5 h-5 text-gray-700" />
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Settings">
          <Settings className="w-5 h-5 text-gray-700" />
        </button>
        <div className="w-9 h-9 rounded-full bg-nos-gold text-white font-semibold flex items-center justify-center text-sm hover:bg-nos-gold/90 transition-colors cursor-pointer" title="Profile">
          AD
        </div>
      </div>
      </div>
    </>
  )
}
