import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tag, Calendar, Clock, User } from 'lucide-react'

const conversationDetails = {
  1: {
    customer: 'Ahmed Hassan',
    phone: '+20 123 456 7890',
    email: 'ahmed.hassan@example.com',
    status: 'active',
    assignee: 'Sarah Johnson',
    tags: ['billing', 'urgent'],
    createdAt: 'Today at 10:30 AM',
    lastMessage: '2 mins ago',
  },
  2: {
    customer: 'Fatima Al-Rashid',
    phone: '+20 987 654 3210',
    email: 'fatima.rashid@example.com',
    status: 'pending',
    assignee: 'John Smith',
    tags: ['orders'],
    createdAt: 'Today at 2:15 PM',
    lastMessage: '15 mins ago',
  },
  3: {
    customer: 'Mohammed Karim',
    phone: '+20 555 123 4567',
    email: 'mohammed.k@example.com',
    status: 'resolved',
    assignee: 'Emily Davis',
    tags: ['returns', 'solved'],
    createdAt: 'Today at 5:20 PM',
    lastMessage: '1 hour ago',
  },
  4: {
    customer: 'Layla Ibrahim',
    phone: '+20 444 987 6543',
    email: 'layla.i@example.com',
    status: 'resolved',
    assignee: 'Sarah Johnson',
    tags: ['tracking'],
    createdAt: 'Today at 9:45 AM',
    lastMessage: '3 hours ago',
  },
  5: {
    customer: 'Khalid Hassan',
    phone: '+20 333 555 7777',
    email: 'khalid.h@example.com',
    status: 'pending',
    assignee: 'Michael Brown',
    tags: ['policy'],
    createdAt: 'Today at 11:30 AM',
    lastMessage: '4 hours ago',
  },
  6: {
    customer: 'Noor Saleh',
    phone: '+20 222 888 9999',
    email: 'noor.s@example.com',
    status: 'resolved',
    assignee: 'Emily Davis',
    tags: ['returns', 'resolved'],
    createdAt: 'Yesterday at 3:00 PM',
    lastMessage: 'Yesterday',
  },
  7: {
    customer: 'Zainab Rashid',
    phone: '+20 111 444 5555',
    email: 'zainab.r@example.com',
    status: 'pending',
    assignee: 'John Smith',
    tags: ['tracking', 'urgent'],
    createdAt: 'Yesterday at 7:15 PM',
    lastMessage: 'Yesterday',
  },
  8: {
    customer: 'Hassan Ahmed',
    phone: '+20 666 777 8888',
    email: 'hassan.a@example.com',
    status: 'resolved',
    assignee: 'Sarah Johnson',
    tags: ['feedback', 'positive'],
    createdAt: '2 days ago at 2:30 PM',
    lastMessage: '2 days ago',
  },
} as Record<number, {
  customer: string
  phone: string
  email: string
  status: string
  assignee: string
  tags: string[]
  createdAt: string
  lastMessage: string
}>

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-blue-100 text-blue-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'resolved':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

interface ConversationDetailsProps {
  conversationId: number
}

export function ConversationDetails({ conversationId }: ConversationDetailsProps) {
  const details = conversationDetails[conversationId]

  if (!details) return null

  return (
    <div className="p-6 space-y-6">
      {/* Customer Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/20 text-foreground font-semibold">
              {details.customer.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{details.customer}</p>
            <span className={`text-xs px-2 py-1 rounded-full font-medium inline-block mt-1 ${getStatusColor(details.status)}`}>
              {details.status}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3 pb-4 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Phone</p>
          <p className="text-sm font-medium text-foreground">{details.phone}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Email</p>
          <p className="text-sm font-medium text-foreground">{details.email}</p>
        </div>
      </div>

      {/* Conversation Info */}
      <div className="space-y-3 pb-4 border-b border-border">
        <div className="flex items-start gap-2">
          <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Assigned to</p>
            <p className="text-sm font-medium text-foreground">{details.assignee}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-sm font-medium text-foreground">{details.createdAt}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Last message</p>
            <p className="text-sm font-medium text-foreground">{details.lastMessage}</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Tags</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {details.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
