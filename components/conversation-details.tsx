import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tag, Calendar, Clock, User, ChevronDown, ChevronUp } from 'lucide-react'

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
  const [conversationOpen, setConversationOpen] = useState(true)
  const [notesOpen, setNotesOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  if (!details) return null

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Customer Header */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-nos-gold/20 text-nos-gold font-semibold">
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

        {/* Conversation Details Section */}
        <div className="border-b border-border pb-4">
          <button
            onClick={() => setConversationOpen(!conversationOpen)}
            className="flex items-center gap-2 mb-4 font-semibold text-xs text-gray-600 uppercase tracking-wider hover:text-foreground transition-colors"
          >
            {conversationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Conversation Details
          </button>
          {conversationOpen && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Assigned Agent</p>
                <select className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white">
                  <option>Sarah Johnson</option>
                  <option>John Smith</option>
                  <option>Emily Davis</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Team</p>
                <select className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white">
                  <option>Customer Service</option>
                  <option>Sales</option>
                  <option>Support</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Priority</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-gray-50 transition-colors">Normal</button>
                  <button className="px-3 py-1.5 text-sm border border-border rounded hover:bg-gray-50 transition-colors">High</button>
                  <button className="px-3 py-1.5 text-sm bg-nos-gold text-white rounded transition-colors">Urgent</button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Log Category</p>
                <select className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white">
                  <option>General Inquiry</option>
                  <option>Technical Issue</option>
                  <option>Billing</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Internal Notes Section */}
        <div className="border-b border-border pb-4">
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="flex items-center gap-2 mb-4 font-semibold text-xs text-gray-600 uppercase tracking-wider hover:text-foreground transition-colors"
          >
            {notesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Internal Notes
          </button>
          {notesOpen && (
            <div className="space-y-3">
              <textarea
                placeholder="Add a note..."
                className="w-full px-3 py-2 rounded-lg border border-yellow-200 bg-yellow-50 text-sm resize-none focus:outline-none"
                rows={3}
              />
              <button className="px-3 py-1.5 text-sm bg-nos-gold text-white rounded hover:bg-nos-gold/90 transition-colors font-medium">
                Add Note
              </button>
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm">
                <p className="text-yellow-900">Customer has VIP status, handle with priority</p>
                <p className="text-xs text-yellow-700 mt-1">Sarah Johnson • 2 hours ago</p>
              </div>
            </div>
          )}
        </div>

        {/* Previous Conversations Section */}
        <div>
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center gap-2 mb-4 font-semibold text-xs text-gray-600 uppercase tracking-wider hover:text-foreground transition-colors"
          >
            {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Previous Conversations
          </button>
          {historyOpen && (
            <div className="space-y-2">
              <button className="w-full text-left p-3 border border-border rounded-lg hover:bg-yellow-50 transition-colors">
                <p className="text-sm font-medium text-foreground">Jun 15, 2026</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">resolved</span>
                  <span className="text-xs text-gray-600">8 messages</span>
                </div>
              </button>
              <button className="w-full text-left p-3 border border-border rounded-lg hover:bg-yellow-50 transition-colors">
                <p className="text-sm font-medium text-foreground">May 3, 2026</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">closed</span>
                  <span className="text-xs text-gray-600">3 messages</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
