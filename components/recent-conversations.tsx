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
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Conversations</h3>
      </div>
      <div className="space-y-3">
        {recentConversations.map((conv) => (
          <div
            key={conv.id}
            className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-1">
              <p className="font-medium text-sm text-foreground">{conv.customer}</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(conv.status)}`}>
                {conv.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{conv.phone}</p>
            <p className="text-xs text-muted-foreground">{conv.time}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
