'use client'

import { Bell, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TopNav() {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-1 bg-nos-gold z-50" />
      <div className="fixed top-1 left-60 right-0 h-16 bg-white border-b border-border flex items-center justify-between px-6 z-40 transition-all duration-300">
      {/* Left side - Page title would go here */}
      <div className="flex-1" />

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-foreground" />
        </button>
        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-foreground" />
        </button>
        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
          <User className="w-5 h-5 text-foreground" />
        </button>
      </div>
      </div>
    </>
  )
}
