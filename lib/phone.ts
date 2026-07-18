/**
 * ─── Egyptian-aware phone normalization (shared) ───────────────
 * Canonical form: +20XXXXXXXXXX
 * Matches a number no matter how it was historically stored:
 * 01…, 201…, +20…, 0020…, "+2 0…" etc.
 */

export const normalizePhone = (raw: string): string => {
  let p = raw.trim().replace(/[\s\-().]/g, '')
  const hadPlus = p.startsWith('+')
  let d = p.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)                                          // 0020… → 20…
  if (!hadPlus && d.startsWith('0') && d.length === 11) return '+20' + d.slice(1) // 01… → +201…
  if (d.startsWith('20') && d.length >= 12) return '+' + d                        // 20… → +20…
  if (hadPlus && d.length >= 7) return '+' + d
  return d
}

/** Every historical way this number could exist in the database. */
export const phoneCandidates = (raw: string): string[] => {
  const norm = normalizePhone(raw)
  const set = new Set<string>([raw.trim(), norm])
  if (norm.startsWith('+20')) {
    set.add('0' + norm.slice(3))      // 01…  (legacy local)
    set.add(norm.slice(1))            // 20…  (no plus)
    set.add('+2 0' + norm.slice(3))   // rare spaced form
  } else if (norm.startsWith('+')) {
    set.add(norm.slice(1))
  }
  return [...set].filter(Boolean)
}

/** Last 8 digits — fallback fuzzy match when exact formats miss. */
export const phoneTail = (raw: string): string => {
  const d = raw.replace(/\D/g, '')
  return d.slice(-8)
}
