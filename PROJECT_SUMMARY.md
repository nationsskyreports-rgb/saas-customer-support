# Nations Of Sky - Customer Support Platform

## Project Overview
Comprehensive multi-agent customer support platform with WhatsApp integration built with Next.js 16, React 19, and Tailwind CSS.

## Design System

### Color Palette
- **Primary Gold**: `#C0992F` (nos-gold) - Main brand color for active states and highlights
- **Light Gold**: `#E8DCC8` (nos-light-gold) - Soft background for hover states
- **Teal Accent**: `#00B69B` (nos-teal) - Secondary accent for charts
- **White**: `#FFFFFF` - Card backgrounds
- **Dark Blue**: `#1A1D29` (sidebar) - Navigation background
- **Neutral Grays**: Used for text and borders

### Typography
- **Fonts**: Geist (sans-serif) and Geist Mono
- **Headings**: Bold, 2xl-3xl for page titles
- **Body**: Regular weight, 14-16px
- **Small text**: 12-13px for metadata

## Key Features Implemented

### 1. **Dashboard** (`/dashboard`)
- Welcome banner with gold background
- 4 Key metric cards (Conversations, Agents, Response Time, Satisfaction)
- Weekly activity chart using Recharts
- Recent conversations sidebar
- Real-time metrics display

### 2. **Messages Management** (`/messages`)
- Pre-defined message templates grid
- 6 template categories (Greeting, Order, Policy, Billing, Closing, Escalation)
- Copy to clipboard functionality
- Edit and delete options for each template
- Filter by category with gold styling

### 3. **Reports Suite** (`/reports/*`)
- **Overview Report**: Dashboard with KPIs, charts, and daily breakdown table
- **Agent Performance**: Agent metrics with performance scores and visualizations
- **Chat Report**: Hourly conversation volume chart and top conversations table
- **Delivery Report**: Message delivery stats with daily breakdown
- **Activity Log**: Timeline view of all system activities with filtering

### 4. **Administration** (`/log-categories`)
- Log category management table
- 6 event types (System, User Action, Status Change, Assignment, Resolution, Escalation)
- Event counts and management actions

## Navigation Structure

### Sidebar Sections
1. **ANALYTICS** - Dashboard, Reports
2. **INBOX** - Conversations, Channels
3. **ADMINISTRATION** - Agents, Teams, Groups, Agent Statuses, Log Categories
4. **CHANNELS** - Channel management
5. **MESSAGES** - Pre-defined messages, Templates
6. **REPORTS** - All report types

## Technical Stack
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts for visualizations
- **Icons**: Lucide React
- **State**: React hooks (useState)
- **Type Safety**: TypeScript

## Component Structure
- `components/sidebar.tsx` - Main navigation
- `components/top-nav.tsx` - Header with accent line
- `components/message-templates.tsx` - Reusable template component
- `components/metrics-chart.tsx` - Chart visualizations
- Page components in `app/[route]/page.tsx`

## Styling Patterns
1. **Cards**: `rounded-xl p-6 border border-border` with white background
2. **Buttons**: Gold primary, light gold secondary
3. **Hover States**: Shadow elevation and color transitions
4. **Tables**: Light gold header row, hover effects on rows
5. **Badges**: Gold text on light gold background
6. **Icons**: Colored based on context (gold, teal, red)

## Data Models

### Message Template
```typescript
{
  id: number
  title: string
  category: 'greeting' | 'order' | 'policy' | 'billing' | 'closing' | 'escalation'
  content: string
  usageCount: number
}
```

### Agent
```typescript
{
  id: number
  name: string
  handled: number
  resolved: number
  avgResponse: string
  avgHandle: string
  onlineHrs: number
  score: number
}
```

### Activity Log Entry
```typescript
{
  id: number
  actor: string
  action: string
  metadata: string
  timestamp: string
  type: 'resolution' | 'status' | 'assignment' | 'system' | 'login'
}
```

## Available Pages

### Dashboard Area
- `/dashboard` - Main dashboard

### Reports Area
- `/reports` - Reports overview
- `/reports/overview` - Overview report with KPIs
- `/reports/agent-performance` - Agent metrics
- `/reports/chat-report` - Chat analytics
- `/reports/delivery-report` - Delivery statistics
- `/reports/activity-log` - Activity timeline

### Messages Area
- `/messages` - Pre-defined messages management

### Administration Area
- `/log-categories` - Log category management

## Environment Setup
- Node.js 18+
- pnpm (recommended)
- Tailwind CSS v4 configuration with custom theme tokens

## Future Enhancements
1. Database integration for persistent data
2. Authentication system
3. Real-time updates with WebSockets
4. Export functionality for reports
5. Advanced filtering and search
6. Mobile responsive improvements
7. Dark mode support

## Deployment
- Ready for Vercel deployment
- All static assets included
- No external dependencies required for core functionality
