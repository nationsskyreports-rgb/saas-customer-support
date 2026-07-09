export interface Agent {
  id: string
  name: string
  email: string
  status: 'online' | 'idle' | 'offline' | 'away'
  role: 'admin' | 'supervisor' | 'agent'
  avatar: string
  joinDate: string
  activeConversations: number
  resolvedToday: number
  satisfaction: number
  team?: string
}

export interface Contact {
  id: string
  name: string
  phone: string
  avatar: string
  lastMessage: string
  lastMessageTime: string
}

export interface Channel {
  id: string
  name: string
  type: 'whatsapp' | 'instagram' | 'facebook'
  status: 'active' | 'inactive'
  connectedAt: string
  phoneNumber?: string
}

export interface Conversation {
  id: string
  contactId: string
  contactName: string
  contactPhone: string
  channelType: 'whatsapp' | 'instagram' | 'facebook'
  agentId: string
  agentName: string
  status: 'open' | 'pending' | 'resolved' | 'archived'
  lastMessage: string
  lastMessageTime: string
  messageCount: number
  duration: string
  satisfaction: number
  tags: string[]
  notes: string
}

export interface Message {
  id: string
  sender: 'agent' | 'customer'
  content: string
  timestamp: string
  agentName?: string
  status?: 'sent' | 'delivered' | 'read'
}

export interface Team {
  id: string
  name: string
  agentCount: number
  supervisor: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface Group {
  id: string
  name: string
  description: string
  memberCount: number
  createdBy: string
  createdAt: string
}

export interface Template {
  id: string
  name: string
  category: string
  content: string
  usageCount: number
  createdAt: string
  createdBy: string
}

export interface Campaign {
  id: string
  name: string
  status: 'draft' | 'scheduled' | 'active' | 'completed'
  type: 'broadcast' | 'targeted'
  recipientCount: number
  sentCount: number
  createdAt: string
  startDate?: string
  endDate?: string
}

// Mock Agents
export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Ahmed Hassan',
    email: 'ahmed@nationofsky.com',
    status: 'online',
    role: 'supervisor',
    avatar: 'AH',
    joinDate: '2024-01-15',
    activeConversations: 5,
    resolvedToday: 12,
    satisfaction: 4.8,
    team: 'Team Alpha',
  },
  {
    id: 'agent-2',
    name: 'Fatima El-Sayed',
    email: 'fatima@nationofsky.com',
    status: 'online',
    role: 'agent',
    avatar: 'FE',
    joinDate: '2024-02-10',
    activeConversations: 3,
    resolvedToday: 8,
    satisfaction: 4.6,
    team: 'Team Alpha',
  },
  {
    id: 'agent-3',
    name: 'Karim Mahmoud',
    email: 'karim@nationofsky.com',
    status: 'idle',
    role: 'agent',
    avatar: 'KM',
    joinDate: '2024-01-20',
    activeConversations: 2,
    resolvedToday: 6,
    satisfaction: 4.5,
    team: 'Team Beta',
  },
  {
    id: 'agent-4',
    name: 'Layla Mohamed',
    email: 'layla@nationofsky.com',
    status: 'away',
    role: 'agent',
    avatar: 'LM',
    joinDate: '2024-03-05',
    activeConversations: 1,
    resolvedToday: 4,
    satisfaction: 4.3,
    team: 'Team Beta',
  },
  {
    id: 'agent-5',
    name: 'Omar Khalil',
    email: 'omar@nationofsky.com',
    status: 'offline',
    role: 'admin',
    avatar: 'OK',
    joinDate: '2023-12-01',
    activeConversations: 0,
    resolvedToday: 0,
    satisfaction: 4.9,
  },
]

// Mock Contacts
export const mockContacts: Contact[] = [
  {
    id: 'contact-1',
    name: 'محمد علي',
    phone: '+201012345678',
    avatar: 'MA',
    lastMessage: 'أين طلبي؟',
    lastMessageTime: '2 min ago',
  },
  {
    id: 'contact-2',
    name: 'سارة الشرقاوي',
    phone: '+201098765432',
    avatar: 'SS',
    lastMessage: 'شكراً على المساعدة',
    lastMessageTime: '15 min ago',
  },
  {
    id: 'contact-3',
    name: 'أحمد إبراهيم',
    phone: '+201055555555',
    avatar: 'AI',
    lastMessage: 'متى يصل المنتج؟',
    lastMessageTime: '1 hour ago',
  },
  {
    id: 'contact-4',
    name: 'ليلى خالد',
    phone: '+201033333333',
    avatar: 'LK',
    lastMessage: 'هناك مشكلة في الطلب',
    lastMessageTime: '2 hours ago',
  },
  {
    id: 'contact-5',
    name: 'يوسف عبدالله',
    phone: '+201077777777',
    avatar: 'YA',
    lastMessage: 'ما هي سياسة الارجاع؟',
    lastMessageTime: '3 hours ago',
  },
  {
    id: 'contact-6',
    name: 'نور حسن',
    phone: '+201099999999',
    avatar: 'NH',
    lastMessage: 'أريد استرجاع المبلغ',
    lastMessageTime: '5 hours ago',
  },
  {
    id: 'contact-7',
    name: 'علي محمود',
    phone: '+201044444444',
    avatar: 'AM',
    lastMessage: 'العميل راضي جداً',
    lastMessageTime: 'Yesterday',
  },
  {
    id: 'contact-8',
    name: 'رنا عمر',
    phone: '+201066666666',
    avatar: 'RO',
    lastMessage: 'شكراً، تم حل المشكلة',
    lastMessageTime: '2 days ago',
  },
]

// Mock Channels
export const mockChannels: Channel[] = [
  {
    id: 'channel-1',
    name: 'Nations Of Sky',
    type: 'whatsapp',
    status: 'active',
    connectedAt: '2024-01-01',
    phoneNumber: '+201201234567',
  },
  {
    id: 'channel-2',
    name: 'NOS Marketing',
    type: 'whatsapp',
    status: 'active',
    connectedAt: '2024-01-15',
  },
]

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    contactId: 'contact-1',
    contactName: 'محمد علي',
    contactPhone: '+201012345678',
    channelType: 'whatsapp',
    agentId: 'agent-1',
    agentName: 'Ahmed Hassan',
    status: 'open',
    lastMessage: 'أين طلبي؟',
    lastMessageTime: '2 min ago',
    messageCount: 8,
    duration: '15 min',
    satisfaction: 4.5,
    tags: ['urgent', 'order-status'],
    notes: 'Customer is checking order status',
  },
  {
    id: 'conv-2',
    contactId: 'contact-2',
    contactName: 'سارة الشرقاوي',
    contactPhone: '+201098765432',
    channelType: 'whatsapp',
    agentId: 'agent-2',
    agentName: 'Fatima El-Sayed',
    status: 'resolved',
    lastMessage: 'شكراً على المساعدة',
    lastMessageTime: '15 min ago',
    messageCount: 12,
    duration: '22 min',
    satisfaction: 4.8,
    tags: ['resolved', 'product-inquiry'],
    notes: 'Customer satisfied with solution',
  },
  {
    id: 'conv-3',
    contactId: 'contact-3',
    contactName: 'أحمد إبراهيم',
    contactPhone: '+201055555555',
    channelType: 'instagram',
    agentId: 'agent-3',
    agentName: 'Karim Mahmoud',
    status: 'pending',
    lastMessage: 'متى يصل المنتج؟',
    lastMessageTime: '1 hour ago',
    messageCount: 5,
    duration: '8 min',
    satisfaction: 3.0,
    tags: ['delivery', 'pending-response'],
    notes: 'Waiting for logistics update',
  },
  {
    id: 'conv-4',
    contactId: 'contact-4',
    contactName: 'ليلى خالد',
    contactPhone: '+201033333333',
    channelType: 'whatsapp',
    agentId: 'agent-1',
    agentName: 'Ahmed Hassan',
    status: 'open',
    lastMessage: 'هناك مشكلة في الطلب',
    lastMessageTime: '2 hours ago',
    messageCount: 10,
    duration: '35 min',
    satisfaction: 3.5,
    tags: ['complaint', 'urgent'],
    notes: 'Product defect reported',
  },
  {
    id: 'conv-5',
    contactId: 'contact-5',
    contactName: 'يوسف عبدالله',
    contactPhone: '+201077777777',
    channelType: 'whatsapp',
    agentId: 'agent-2',
    agentName: 'Fatima El-Sayed',
    status: 'resolved',
    lastMessage: 'ما هي سياسة الارجاع؟',
    lastMessageTime: '3 hours ago',
    messageCount: 6,
    duration: '12 min',
    satisfaction: 4.7,
    tags: ['policy', 'resolved'],
    notes: 'Explained return policy',
  },
]

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    sender: 'customer',
    content: 'مرحباً، هل يمكنني الاستفسار عن طلبي؟',
    timestamp: '10:30 AM',
  },
  {
    id: 'msg-2',
    sender: 'agent',
    content: 'مرحباً بك! بالتأكيد، ما هو رقم طلبك؟',
    timestamp: '10:32 AM',
    agentName: 'Ahmed Hassan',
    status: 'read',
  },
  {
    id: 'msg-3',
    sender: 'customer',
    content: 'الطلب رقم #12345',
    timestamp: '10:33 AM',
  },
  {
    id: 'msg-4',
    sender: 'agent',
    content: 'شكراً لك! دعني أتحقق من تفاصيل طلبك...',
    timestamp: '10:34 AM',
    agentName: 'Ahmed Hassan',
    status: 'read',
  },
  {
    id: 'msg-5',
    sender: 'agent',
    content: 'طلبك قيد الشحن حالياً ويتوقع وصوله خلال 2-3 أيام عمل',
    timestamp: '10:35 AM',
    agentName: 'Ahmed Hassan',
    status: 'read',
  },
]

// Mock Teams
export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Team Alpha',
    agentCount: 3,
    supervisor: 'Ahmed Hassan',
    status: 'active',
    createdAt: '2024-01-10',
  },
  {
    id: 'team-2',
    name: 'Team Beta',
    agentCount: 2,
    supervisor: 'TBD',
    status: 'active',
    createdAt: '2024-02-01',
  },
]

// Mock Groups
export const mockGroups: Group[] = [
  {
    id: 'group-1',
    name: 'VIP Customers',
    description: 'High-value customers requiring priority support',
    memberCount: 45,
    createdBy: 'Ahmed Hassan',
    createdAt: '2024-01-20',
  },
  {
    id: 'group-2',
    name: 'New Customers',
    description: 'Recently registered customers',
    memberCount: 128,
    createdBy: 'Fatima El-Sayed',
    createdAt: '2024-02-15',
  },
  {
    id: 'group-3',
    name: 'Product Issues',
    description: 'Customers with reported product defects',
    memberCount: 23,
    createdBy: 'Karim Mahmoud',
    createdAt: '2024-03-01',
  },
]

// Mock Templates
export const mockTemplates: Template[] = [
  {
    id: 'tmpl-1',
    name: 'Order Confirmation',
    category: 'greeting',
    content: 'شكراً لطلبك! رقم الطلب: {{order_id}}. سيتم الشحن اليوم.',
    usageCount: 342,
    createdAt: '2024-01-10',
    createdBy: 'Ahmed Hassan',
  },
  {
    id: 'tmpl-2',
    name: 'Shipment Notification',
    category: 'order',
    content: 'تم شحن طلبك! رقم التتبع: {{tracking_id}}. تابع الشحنة هنا: {{link}}',
    usageCount: 298,
    createdAt: '2024-01-15',
    createdBy: 'Fatima El-Sayed',
  },
  {
    id: 'tmpl-3',
    name: 'Return Policy',
    category: 'policy',
    content: 'يمكنك إرجاع المنتج خلال 14 يوم من الاستقبال. تتحمل الشحن.',
    usageCount: 156,
    createdAt: '2024-01-20',
    createdBy: 'Karim Mahmoud',
  },
  {
    id: 'tmpl-4',
    name: 'Refund Initiated',
    category: 'billing',
    content: 'تم بدء عملية استرجاع المبلغ. ستستقبل المبلغ خلال 3-5 أيام عمل.',
    usageCount: 89,
    createdAt: '2024-02-01',
    createdBy: 'Ahmed Hassan',
  },
  {
    id: 'tmpl-5',
    name: 'Closing Message',
    category: 'closing',
    content: 'شكراً لتواصلك معنا! هل هناك أي شيء آخر نستطيع مساعدتك به؟',
    usageCount: 267,
    createdAt: '2024-02-10',
    createdBy: 'Fatima El-Sayed',
  },
  {
    id: 'tmpl-6',
    name: 'Escalation Notice',
    category: 'escalation',
    content: 'تم تحويل طلبك إلى فريق متخصص. سيتواصلون معك قريباً.',
    usageCount: 45,
    createdAt: '2024-02-20',
    createdBy: 'Karim Mahmoud',
  },
]

// Mock Campaigns
export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Spring Sale Announcement',
    status: 'active',
    type: 'broadcast',
    recipientCount: 5420,
    sentCount: 4892,
    createdAt: '2024-03-10',
    startDate: '2024-03-15',
  },
  {
    id: 'camp-2',
    name: 'VIP Customer Appreciation',
    status: 'scheduled',
    type: 'targeted',
    recipientCount: 256,
    sentCount: 0,
    createdAt: '2024-03-12',
    startDate: '2024-03-20',
  },
  {
    id: 'camp-3',
    name: 'Product Launch',
    status: 'completed',
    type: 'broadcast',
    recipientCount: 8945,
    sentCount: 8945,
    createdAt: '2024-02-28',
    startDate: '2024-03-01',
    endDate: '2024-03-08',
  },
]
