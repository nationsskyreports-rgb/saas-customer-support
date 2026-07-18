import { supabase } from './supabase'


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


/** Free capacity for an agent right now (max_chats − current open load). */
async function agentCapacity(agentId: string): Promise<number> {
  const { data: agent } = await supabase
    .from('agents')
    .select('id, max_chats, status, is_active')
    .eq('id', agentId)
    .maybeSingle()
  if (!agent || !agent.is_active || agent.status !== 'online') return 0

  const { count } = await supabase
    .from('conversations')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_agent_id', agentId)
    .in('status', ['open', 'pending'])

  return Math.max(0, (agent.max_chats || 5) - (count || 0))
}


export async function drainQueueToAgent(agentId: string): Promise<number> {
  try {
    let capacity = await agentCapacity(agentId)
    if (capacity <= 0) return 0
    let taken = 0

    // ── 1) The queue: unassigned open/pending, oldest waiting first ──
    const { data: queued } = await supabase
      .from('conversations')
      .select('id')
      .in('status', ['open', 'pending'])
      .is('assigned_agent_id', null)
      .order('updated_at', { ascending: true })
      .limit(capacity)

    for (const conv of queued || []) {
      if (capacity <= 0) break
      // conditional claim — only if it is STILL unassigned
      const { data: claimed } = await supabase
        .from('conversations')
        .update({ assigned_agent_id: agentId })
        .eq('id', conv.id)
        .is('assigned_agent_id', null)
        .select('id')
      if (claimed && claimed.length > 0) {
        capacity--; taken++
        try {
          await supabase.from('activity_logs').insert({
            action: 'assignment',
            description: 'Auto-assigned from queue: agent came online',
            conversation_id: conv.id,
          })
        } catch {}
      }
    }

    // ── 2) Rescue chats stuck with OFFLINE agents ──
    if (capacity > 0) {
      const { data: offlineAgents } = await supabase
        .from('agents')
        .select('id')
        .eq('status', 'offline')
      const offlineIds = (offlineAgents || []).map(a => a.id).filter(id => id !== agentId)

      if (offlineIds.length > 0) {
        const { data: stuck } = await supabase
          .from('conversations')
          .select('id, assigned_agent_id')
          .in('status', ['open', 'pending'])
          .in('assigned_agent_id', offlineIds)
          .order('updated_at', { ascending: true })
          .limit(capacity)

        for (const conv of stuck || []) {
          if (capacity <= 0) break
          // conditional hand-over — only if still held by that offline agent
          const { data: moved } = await supabase
            .from('conversations')
            .update({ assigned_agent_id: agentId })
            .eq('id', conv.id)
            .eq('assigned_agent_id', conv.assigned_agent_id)
            .select('id')
          if (moved && moved.length > 0) {
            capacity--; taken++
            try {
              await supabase.from('activity_logs').insert({
                action: 'assignment',
                description: 'Rescued from an offline agent: new agent came online',
                conversation_id: conv.id,
              })
            } catch {}
          }
        }
      }
    }

    return taken
  } catch {
    return 0
  }
}


export async function releaseAgentChats(agentId: string): Promise<void> {
  try {
    const { data: myConvs } = await supabase
      .from('conversations')
      .select('id')
      .eq('assigned_agent_id', agentId)
      .in('status', ['open', 'pending'])
      .order('updated_at', { ascending: true })
    if (!myConvs || myConvs.length === 0) return

    // Online colleagues with their remaining capacity
    const { data: onlineAgents } = await supabase
      .from('agents')
      .select('id, max_chats')
      .eq('status', 'online')
      .eq('is_active', true)
      .neq('id', agentId)

    const pool: Array<{ id: string; free: number }> = []
    if (onlineAgents && onlineAgents.length > 0) {
      const { data: openConvs } = await supabase
        .from('conversations')
        .select('assigned_agent_id')
        .in('status', ['open', 'pending'])
        .not('assigned_agent_id', 'is', null)
      const load: Record<string, number> = {}
      openConvs?.forEach(c => {
        if (c.assigned_agent_id) load[c.assigned_agent_id] = (load[c.assigned_agent_id] || 0) + 1
      })
      onlineAgents.forEach(a => {
        const free = (a.max_chats || 5) - (load[a.id] || 0)
        if (free > 0) pool.push({ id: a.id, free })
      })
      pool.sort((a, b) => b.free - a.free) // most capacity first
    }

    let poolIdx = 0
    for (const conv of myConvs) {
      // next colleague with free capacity (round-robin)
      let target: string | null = null
      for (let i = 0; i < pool.length; i++) {
        const cand = pool[(poolIdx + i) % pool.length]
        if (cand.free > 0) { target = cand.id; cand.free--; poolIdx = (poolIdx + i + 1) % Math.max(pool.length, 1); break }
      }

      // conditional hand-over — only if the chat is still mine
      const { data: moved } = await supabase
        .from('conversations')
        .update({ assigned_agent_id: target }) // null → back to the queue
        .eq('id', conv.id)
        .eq('assigned_agent_id', agentId)
        .select('id')

      if (moved && moved.length > 0) {
        try {
          await supabase.from('activity_logs').insert({
            action: 'assignment',
            description: target
              ? 'Redistributed: previous agent went offline'
              : 'Returned to queue: agent went offline and no colleague has capacity',
            conversation_id: conv.id,
          })
        } catch {}
      }
    }
  } catch {
    // Never let routing break a status change or logout
  }
}
