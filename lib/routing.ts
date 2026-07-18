import { supabase } from './supabase'

/**
 * ─── Chat Routing Rules ────────────────────────────────────────
 * The single source of truth for how conversations reach agents:
 *
 * 1. NEW conversation      → least-loaded ONLINE agent with free capacity
 * 2. RETURNING customer    → reuse their conversation, BUT if its agent is
 *                            offline/inactive, re-route to an online agent
 * 3. NOBODY online         → conversation becomes UNASSIGNED (queue) so the
 *                            next agent who comes online picks it up —
 *                            it must never stay stuck on an offline agent
 * 4. OUTSIDE working hours → the widget shows the official-hours notice
 *                            (10:00 → 22:00 Africa/Cairo)
 */

// ── Official working hours ──
export const WORKING_HOURS = {
  start: 10, // 10:00 AM
  end: 22,   // 10:00 PM
  timeZone: 'Africa/Cairo',
  label: '10:00 AM – 10:00 PM',
  labelAr: 'من 10 صباحًا حتى 10 مساءً',
}

export function isWithinWorkingHours(now: Date = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: WORKING_HOURS.timeZone,
    }).format(now)
  )
  return hour >= WORKING_HOURS.start && hour < WORKING_HOURS.end
}

export const OUT_OF_HOURS_MESSAGE =
  `شكرًا لتواصلك معنا 🙏\n` +
  `مواعيد العمل الرسمية ${WORKING_HOURS.labelAr}.\n` +
  `رسالتك وصلت وهيتم الرد عليك في أقرب وقت خلال مواعيد العمل.`

/** Least-loaded ONLINE + ACTIVE agent who still has free capacity (or null). */
export async function pickBestOnlineAgent(): Promise<string | null> {
  try {
    const { data: onlineAgents } = await supabase
      .from('agents')
      .select('id, max_chats')
      .eq('status', 'online')
      .eq('is_active', true)
    if (!onlineAgents || onlineAgents.length === 0) return null

    const { data: openConvs } = await supabase
      .from('conversations')
      .select('assigned_agent_id')
      .in('status', ['open', 'pending'])
      .not('assigned_agent_id', 'is', null)

    const load: Record<string, number> = {}
    openConvs?.forEach(c => {
      if (c.assigned_agent_id) load[c.assigned_agent_id] = (load[c.assigned_agent_id] || 0) + 1
    })

    const candidates = onlineAgents
      .map(a => ({ id: a.id, load: load[a.id] || 0, max: a.max_chats || 5 }))
      .filter(a => a.load < a.max)
      .sort((a, b) => a.load - b.load)

    return candidates.length > 0 ? candidates[0].id : null
  } catch {
    return null
  }
}

/**
 * THE FIX for "chat routed to me while I was offline":
 * call this whenever a customer opens/continues/reopens a conversation.
 *
 * - Assigned agent is online          → do nothing
 * - Agent offline/inactive/missing    → hand over to the best online agent
 * - Nobody online at all              → UNASSIGN it (goes to the open queue,
 *                                       visible in All Conversations) instead
 *                                       of silently piling on an offline agent
 */
export async function reassignIfAgentUnavailable(conversationId: string): Promise<void> {
  try {
    const { data: conv } = await supabase
      .from('conversations')
      .select('id, assigned_agent_id, status')
      .eq('id', conversationId)
      .maybeSingle()
    if (!conv) return

    // Is the current assignee actually available?
    if (conv.assigned_agent_id) {
      const { data: agent } = await supabase
        .from('agents')
        .select('id, status, is_active')
        .eq('id', conv.assigned_agent_id)
        .maybeSingle()
      if (agent && agent.is_active && agent.status === 'online') return // all good
    }

    const best = await pickBestOnlineAgent()

    if (best && best !== conv.assigned_agent_id) {
      await supabase.from('conversations')
        .update({ assigned_agent_id: best })
        .eq('id', conversationId)
      try {
        await supabase.from('activity_logs').insert({
          action: 'assignment',
          description: conv.assigned_agent_id
            ? 'Auto-reassigned: previous agent is offline'
            : 'Auto-assigned from queue: customer returned',
          conversation_id: conversationId,
        })
      } catch {}
    } else if (!best && conv.assigned_agent_id) {
      // Previous agent offline + nobody else online → back to the queue
      await supabase.from('conversations')
        .update({ assigned_agent_id: null })
        .eq('id', conversationId)
      try {
        await supabase.from('activity_logs').insert({
          action: 'assignment',
          description: 'Unassigned: agent offline and no other agent online (queued)',
          conversation_id: conversationId,
        })
      } catch {}
    }
  } catch {
    // Routing must never break the customer's ability to send a message
  }
}
