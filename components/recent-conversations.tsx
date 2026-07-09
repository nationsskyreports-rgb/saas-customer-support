'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

const recentConversations = [
  {
    id: 1,
    customer: 'Ahmed Hassan',
    phone: '+20 123 456 7890',
    status: 'resolved',
    time: '2 hours ago',
  },
  {
    id: 2,
    customer: 'Fatima Al-Rashid',
    phone: '+20 987 654 3210',
    status: 'pending',
    time: '15 minutes ago',
  },
  {
    id: 3,
    customer: 'Mohammed Karim',
    phone: '+20 555 123 4567',
    status: 'active',
    time: 'Just now',
  },
  {
    id: 4,
    customer: 'Layla Ibrahim',
    phone: '+20 444 987 6543',
    status: 'resolved',
    time: '4 hours ago',
  },
]

function getStatusColor(status: string) {
  switch (status) {
    case 'resolved':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'active':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function RecentConversations() {
  const router = useRouter()

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Recent Conversations</h3>
        <Link href="/conversations" className="text-sm font-semibold text-nos-gold hover:text-nos-gold/80 transition-colors">
          View All
        </Link>
      </div>
      <div className="space-y-3">
        {recentConversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => router.push(`/inbox?conversationId=${conv.id}`)}
            className="w-full p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-start justify-between mb-1">
              <p className="font-medium text-sm text-foreground">{conv.customer}</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(conv.status)}`}>
                {conv.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{conv.phone}</p>
            <p className="text-xs text-muted-foreground">{conv.time}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
