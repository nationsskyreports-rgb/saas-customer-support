'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Zap, Smile, Paperclip, MoreVertical } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const messages = {
  1: [
    { id: 1, sender: 'customer', text: 'Hi, I need help with my order', time: '10:30 AM' },
    { id: 2, sender: 'agent', text: "Hello! I'd be happy to help. What's your order number?", time: '10:31 AM' },
    { id: 3, sender: 'customer', text: 'It\'s #ORD-12345', time: '10:32 AM' },
    { id: 4, sender: 'agent', text: 'Thank you. I found your order. It\'s currently being processed and will ship tomorrow.', time: '10:33 AM' },
    { id: 5, sender: 'customer', text: 'Thanks for your help!', time: '10:34 AM' },
  ],
  2: [
    { id: 1, sender: 'customer', text: 'Can you help with my order?', time: '2:15 PM' },
    { id: 2, sender: 'agent', text: 'Of course! What seems to be the issue?', time: '2:16 PM' },
    { id: 3, sender: 'customer', text: 'I haven\'t received it yet', time: '2:17 PM' },
  ],
  3: [
    { id: 1, sender: 'customer', text: 'I received the wrong item', time: '5:20 PM' },
    { id: 2, sender: 'agent', text: 'I apologize for that. Let me help you with a replacement.', time: '5:21 PM' },
    { id: 3, sender: 'customer', text: 'Great, I will wait for updates', time: '5:22 PM' },
  ],
  4: [
    { id: 1, sender: 'customer', text: 'Hi, I wanted to track my package', time: '9:45 AM' },
    { id: 2, sender: 'agent', text: 'Sure! Can you provide your order number?', time: '9:46 AM' },
    { id: 3, sender: 'customer', text: 'Perfect, thank you!', time: '9:47 AM' },
  ],
  5: [
    { id: 1, sender: 'customer', text: 'I have a question about the return policy', time: '11:30 AM' },
  ],
  6: [
    { id: 1, sender: 'customer', text: 'I want to return this item', time: '3:00 PM' },
    { id: 2, sender: 'agent', text: 'Of course! I can help with that.', time: '3:01 PM' },
    { id: 3, sender: 'customer', text: 'Thank you for resolving this', time: '3:02 PM' },
  ],
  7: [
    { id: 1, sender: 'customer', text: 'When will my order arrive?', time: '7:15 PM' },
  ],
  8: [
    { id: 1, sender: 'customer', text: 'I received my order', time: '2:30 PM' },
    { id: 2, sender: 'agent', text: 'Great! Please let us know if you have any issues.', time: '2:31 PM' },
    { id: 3, sender: 'customer', text: 'I received my order, thanks!', time: '2:32 PM' },
  ],
} as Record<number, Array<{ id: number; sender: string; text: string; time: string }>>

const conversationInfo = {
  1: { customer: 'Ahmed Hassan', phone: '+20 123 456 7890' },
  2: { customer: 'Fatima Al-Rashid', phone: '+20 987 654 3210' },
  3: { customer: 'Mohammed Karim', phone: '+20 555 123 4567' },
  4: { customer: 'Layla Ibrahim', phone: '+20 444 987 6543' },
  5: { customer: 'Khalid Hassan', phone: '+20 333 555 7777' },
  6: { customer: 'Noor Saleh', phone: '+20 222 888 9999' },
  7: { customer: 'Zainab Rashid', phone: '+20 111 444 5555' },
  8: { customer: 'Hassan Ahmed', phone: '+20 666 777 8888' },
} as Record<number, { customer: string; phone: string }>

interface ChatPanelProps {
  conversationId: number
}

export function ChatPanel({ conversationId }: ChatPanelProps) {
  const [message, setMessage] = useState('')
  const [displayMessages, setDisplayMessages] = useState(messages[conversationId] || [])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDisplayMessages(messages[conversationId] || [])
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationId])

  const handleSend = () => {
    if (message.trim()) {
      const newMessage = {
        id: displayMessages.length + 1,
        sender: 'agent',
        text: message,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }
      setDisplayMessages([...displayMessages, newMessage])
      setMessage('')
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const info = conversationInfo[conversationId]
  const initials = info?.customer.split(' ').map(n => n[0]).join('') || 'AA'

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Topbar */}
      <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4 flex-shrink-0">
        {/* Left: Contact Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-nos-gold text-white flex items-center justify-center font-semibold text-sm">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{info?.customer}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-500">{info?.phone}</p>
              <span className="px-2 py-0.5 bg-nos-teal text-white text-xs font-semibold rounded-full">
                Nations Of Sky
              </span>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm font-medium text-foreground bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            Snooze
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-white bg-nos-teal rounded hover:bg-nos-teal/90 transition-colors">
            Resolve
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-foreground bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            Close
          </button>
          <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {displayMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <>
            {displayMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === 'agent'
                      ? 'bg-nos-gold text-white'
                      : 'bg-gray-100 text-foreground'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender === 'agent' ? 'text-white/70' : 'text-gray-600'
                  }`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Bar */}
      <div className="border-t border-gray-200 bg-white" style={{ height: '64px', padding: '0 16px' }}>
        <div className="flex items-center gap-3 h-full">
          {/* Left Icon Buttons */}
          <button className="p-2 text-gray-600 hover:text-nos-gold transition-colors" title="Pre-defined messages">
            <Zap className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-nos-gold transition-colors" title="Emoji">
            <Smile className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-nos-gold transition-colors" title="Attachment">
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-full py-2 resize-none border-0 outline-none bg-transparent text-foreground placeholder-gray-400 font-normal text-sm"
            style={{ fontFamily: 'inherit' }}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-nos-gold text-white hover:bg-nos-gold/90 transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
