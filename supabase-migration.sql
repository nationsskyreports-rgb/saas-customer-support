-- ============================================
-- Nations Of Sky - Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. AGENTS table (already exists, skip if present)
-- CREATE TABLE IF NOT EXISTS agents (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   name TEXT NOT NULL,
--   email TEXT UNIQUE NOT NULL,
--   role TEXT DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
--   status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'away', 'offline')),
--   is_active BOOLEAN DEFAULT true,
--   max_chats INT DEFAULT 5,
--   created_at TIMESTAMPTZ DEFAULT now()
-- );

-- 2. LOG CATEGORIES
CREATE TABLE IF NOT EXISTS log_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO log_categories (name, description) VALUES
  ('System Event', 'Automatic system operations'),
  ('User Action', 'Manual user interactions'),
  ('Status Change', 'Agent status modifications'),
  ('Assignment', 'Conversation assignments'),
  ('Resolution', 'Conversation resolutions'),
  ('Escalation', 'Escalation events')
ON CONFLICT DO NOTHING;

-- 3. AGENT STATUSES (custom statuses the admin can define)
CREATE TABLE IF NOT EXISTS agent_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6B7280',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO agent_statuses (name, color, is_default) VALUES
  ('Online', '#22C55E', true),
  ('Busy', '#EAB308', true),
  ('Away', '#9CA3AF', true),
  ('Offline', '#EF4444', true)
ON CONFLICT DO NOTHING;

-- 4. TEAMS
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'supervisor')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, team_id)
);

INSERT INTO teams (name, description) VALUES
  ('Customer Service', 'Front-line customer support team'),
  ('Technical Support', 'Technical issue resolution'),
  ('Marketing', 'Marketing and outreach team')
ON CONFLICT DO NOTHING;

-- 5. GROUPS
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, group_id)
);

INSERT INTO groups (name, description) VALUES
  ('VIP Customers', 'High-value customers requiring priority support'),
  ('New Customers', 'Recently registered customers'),
  ('Product Issues', 'Customers with reported product defects')
ON CONFLICT DO NOTHING;

-- 6. CHANNELS
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'whatsapp' CHECK (type IN ('whatsapp', 'instagram', 'facebook')),
  phone TEXT DEFAULT '',
  availability BOOLEAN DEFAULT true,
  welcome_message TEXT DEFAULT 'Welcome! How can we help you today?',
  away_message TEXT DEFAULT 'We are currently away. Our team will get back to you shortly.',
  assign_mode TEXT DEFAULT 'auto' CHECK (assign_mode IN ('auto', 'manual')),
  max_chats_per_agent INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO channels (name, type, phone) VALUES
  ('Nations Of Sky', 'whatsapp', '+20215555'),
  ('NOS Marketing', 'whatsapp', '201106973901')
ON CONFLICT DO NOTHING;

-- 7. TEMPLATES
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'greeting',
  language TEXT DEFAULT 'ar',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO templates (name, category, content) VALUES
  ('Order Confirmation', 'greeting', 'شكراً لطلبك! رقم الطلب: {{order_id}}. سيتم الشحن اليوم.'),
  ('Shipment Notification', 'order', 'تم شحن طلبك! رقم التتبع: {{tracking_id}}. تابع الشحنة هنا: {{link}}'),
  ('Return Policy', 'policy', 'يمكنك إرجاع المنتج خلال 14 يوم من الاستقبال. تتحمل الشحن.'),
  ('Refund Initiated', 'billing', 'تم بدء عملية استرجاع المبلغ. ستستقبل المبلغ خلال 3-5 أيام عمل.'),
  ('Closing Message', 'closing', 'شكراً لتواصلك معنا! هل هناك أي شيء آخر نستطيع مساعدتك به؟'),
  ('Escalation Notice', 'escalation', 'تم تحويل طلبك إلى فريق متخصص. سيتواصلون معك قريباً.')
ON CONFLICT DO NOTHING;

-- 8. CAMPAIGNS
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed')),
  type TEXT DEFAULT 'broadcast' CHECK (type IN ('broadcast', 'targeted')),
  recipient_count INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO campaigns (name, status, type, recipient_count, sent_count) VALUES
  ('Spring Sale Announcement', 'active', 'broadcast', 5420, 4892),
  ('VIP Customer Appreciation', 'scheduled', 'targeted', 256, 0),
  ('Product Launch', 'completed', 'broadcast', 8945, 8945)
ON CONFLICT DO NOTHING;

-- 9. CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  log_category_id UUID REFERENCES log_categories(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('agent', 'customer')),
  content TEXT NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT DEFAULT '',
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (allow all for anon key)
-- ============================================
ALTER TABLE log_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow full access via anon key (adjust for production)
CREATE POLICY "Allow all on log_categories" ON log_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on agent_statuses" ON agent_statuses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on agent_teams" ON agent_teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on groups" ON groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on agent_groups" ON agent_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on channels" ON channels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on templates" ON templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on campaigns" ON campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on activity_log" ON activity_log FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
