'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const messages = {
  1: [
    { id: 1, sender: 'customer', text: 'Hi, I need help with my order', time: '10:30 AM' },
    { id: 2, sender: 'agent', text: 'Hello! I&apos;d be happy to help. What&apos;s your order number?', time: '10:31 AM' },
    { id: 3, sender: 'customer', text: 'It&apos;s #ORD-12345', time: '10:32 AM' },
    { id: 4, sender: 'agent', text: 'Thank you. I found your order. It&apos;s currently being processed and will ship tomorrow.', time: '10:33 AM' },
    { id: 5, sender: 'customer', text: 'Thanks for your help!', time: '10:34 AM' },
  ],
  2: [
    { id: 1, sender: 'customer', text: 'Can you help with my order?', time: '2:15 PM' },
    { id: 2, sender: 'agent', text: 'Of course! What seems to be the issue?', time: '2:16 PM' },
    { id: 3, sender: 'customer', text: 'I haven&apos;t received it yet', time: '2:17 PM' },
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

  return (
    <div className="flex flex-col h-full">
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
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender === 'agent' ? 'text-primary-foreground/70' : 'text-muted-foreground'
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

      {/* Input */}
      <div className="border-t border-border p-4 bg-white">
        <div className="flex gap-2">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </button>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={2}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
