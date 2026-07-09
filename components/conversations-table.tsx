import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Eye, Clock, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const conversations = [
  {
    id: 1,
    customer: 'Ahmed Hassan',
    phone: '+20 123 456 7890',
    agent: 'Sarah Johnson',
    messages: 12,
    duration: '45 mins',
    status: 'resolved',
    date: 'Today at 10:30 AM',
    satisfaction: 95,
  },
  {
    id: 2,
    customer: 'Fatima Al-Rashid',
    phone: '+20 987 654 3210',
    agent: 'John Smith',
    messages: 8,
    duration: '20 mins',
    status: 'pending',
    date: 'Today at 2:15 PM',
    satisfaction: 88,
  },
  {
    id: 3,
    customer: 'Mohammed Karim',
    phone: '+20 555 123 4567',
    agent: 'Emily Davis',
    messages: 15,
    duration: '1 hour',
    status: 'resolved',
    date: 'Today at 5:20 PM',
    satisfaction: 92,
  },
  {
    id: 4,
    customer: 'Layla Ibrahim',
    phone: '+20 444 987 6543',
    agent: 'Sarah Johnson',
    messages: 5,
    duration: '10 mins',
    status: 'resolved',
    date: 'Today at 9:45 AM',
    satisfaction: 90,
  },
  {
    id: 5,
    customer: 'Khalid Hassan',
    phone: '+20 333 555 7777',
    agent: 'Michael Brown',
    messages: 3,
    duration: '5 mins',
    status: 'pending',
    date: 'Today at 11:30 AM',
    satisfaction: null,
  },
  {
    id: 6,
    customer: 'Noor Saleh',
    phone: '+20 222 888 9999',
    agent: 'Emily Davis',
    messages: 18,
    duration: '1.5 hours',
    status: 'resolved',
    date: 'Yesterday at 3:00 PM',
    satisfaction: 96,
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

export function ConversationsTable() {
  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted border-b border-border">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Customer</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Agent</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Messages</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Duration</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Status</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Date</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Satisfaction</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {conversations.map((conv) => (
            <tr key={conv.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-foreground text-xs font-semibold">
                      {conv.customer.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-foreground">{conv.customer}</p>
                    <p className="text-xs text-muted-foreground">{conv.phone}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-foreground">{conv.agent}</p>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  {conv.messages}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {conv.duration}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={cn('text-xs px-2 py-1 rounded-full font-medium', getStatusColor(conv.status))}>
                  {conv.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-muted-foreground">{conv.date}</p>
              </td>
              <td className="px-6 py-4">
                {conv.satisfaction ? (
                  <p className="text-sm font-medium text-foreground">{conv.satisfaction}%</p>
                ) : (
                  <p className="text-sm text-muted-foreground">-</p>
                )}
              </td>
              <td className="px-6 py-4">
                <button className="p-1 hover:bg-muted rounded-lg transition-colors">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
