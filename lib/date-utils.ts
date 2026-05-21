// All app-facing dates render in India Standard Time (Asia/Kolkata, UTC+5:30, no DST)
// so server-rendered pages match what an Indian student/admin expects, regardless of
// where the Node runtime is located.

const IST_TZ = 'Asia/Kolkata'
const IST_OFFSET_MIN = 330 // +5:30

type Input = Date | string | number | null | undefined

function toDate(d: Input): Date | null {
  if (d === null || d === undefined || d === '') return null
  const date = d instanceof Date ? d : new Date(d)
  return Number.isNaN(date.getTime()) ? null : date
}

type Parts = Partial<Record<Intl.DateTimeFormatPartTypes, string>>

function parts(d: Date, options: Intl.DateTimeFormatOptions): Parts {
  const formatter = new Intl.DateTimeFormat('en-US', { ...options, timeZone: IST_TZ })
  const out: Parts = {}
  for (const p of formatter.formatToParts(d)) {
    out[p.type] = p.value
  }
  return out
}

// "May 21, 2026"
export function formatISTDate(d: Input): string {
  const date = toDate(d)
  if (!date) return ''
  const p = parts(date, { year: 'numeric', month: 'short', day: '2-digit' })
  return `${p.month} ${p.day}, ${p.year}`
}

// "May 21, 2026 · 03:30 PM"
export function formatISTDateTime(d: Input): string {
  const date = toDate(d)
  if (!date) return ''
  const p = parts(date, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
  return `${p.month} ${p.day}, ${p.year} · ${p.hour}:${p.minute} ${p.dayPeriod}`
}

// "May 21, 03:30 PM"
export function formatISTShortDateTime(d: Input): string {
  const date = toDate(d)
  if (!date) return ''
  const p = parts(date, {
    month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
  return `${p.month} ${p.day}, ${p.hour}:${p.minute} ${p.dayPeriod}`
}

// "May 21, 3:30 PM"  (no leading zeroes on day/hour)
export function formatISTShortDateTimeNoPad(d: Input): string {
  const date = toDate(d)
  if (!date) return ''
  const p = parts(date, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
  return `${p.month} ${p.day}, ${p.hour}:${p.minute} ${p.dayPeriod}`
}

// "3:30 PM"
export function formatISTTime(d: Input): string {
  const date = toDate(d)
  if (!date) return ''
  const p = parts(date, { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${p.hour}:${p.minute} ${p.dayPeriod}`
}

// "Wed"
export function formatISTWeekday(d: Input): string {
  const date = toDate(d)
  if (!date) return ''
  const p = parts(date, { weekday: 'short' })
  return p.weekday ?? ''
}

// "Wed, May 21 · 03:30 PM"
export function formatISTWeekdayDateTime(d: Input): string {
  const date = toDate(d)
  if (!date) return ''
  const p = parts(date, {
    weekday: 'short', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
  return `${p.weekday}, ${p.month} ${p.day} · ${p.hour}:${p.minute} ${p.dayPeriod}`
}

// "Wed, May 21 2026 · 03:30 PM"
export function formatISTFullDateTime(d: Input): string {
  const date = toDate(d)
  if (!date) return ''
  const p = parts(date, {
    weekday: 'short', year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
  return `${p.weekday}, ${p.month} ${p.day} ${p.year} · ${p.hour}:${p.minute} ${p.dayPeriod}`
}

// "2026-05-21" — calendar date in IST, suitable for grouping/comparing days.
export function getISTDateKey(d: Input = new Date()): string {
  const date = toDate(d)
  if (!date) return ''
  const p = parts(date, { year: 'numeric', month: '2-digit', day: '2-digit' })
  return `${p.year}-${p.month}-${p.day}`
}

// Convert a UTC ISO string to the value expected by <input type="datetime-local">
// where the wall clock shown is IST.  E.g. "2026-05-21T10:00:00Z" -> "2026-05-21T15:30".
export function toISTDateTimeLocalInput(iso: string | null | undefined): string {
  const date = toDate(iso ?? null)
  if (!date) return ''
  const p = parts(date, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
  // Intl with hour12:false can render midnight as "24" in some locales — normalise.
  const hour = p.hour === '24' ? '00' : p.hour
  return `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}`
}

// Inverse of toISTDateTimeLocalInput: takes "YYYY-MM-DDTHH:mm" interpreted as IST
// wall clock and returns the corresponding UTC ISO string for storage.
export function fromISTDateTimeLocalInput(local: string | null | undefined): string | null {
  if (!local) return null
  // Anchor the value to IST so the runtime's timezone doesn't influence the parse.
  const withTz = local.length === 16 ? `${local}:00+05:30` : `${local}+05:30`
  const d = new Date(withTz)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

// Subtract whole days in IST: returns the Date corresponding to (now - daysAgo) in IST
// at the start of that IST day, expressed as a Date instant.
export function istStartOfDayDaysAgo(daysAgo: number): Date {
  const now = new Date()
  // Shift forward by IST offset, floor to UTC midnight, then shift back — that gives
  // the UTC instant matching 00:00 IST of "now".
  const istNow = new Date(now.getTime() + IST_OFFSET_MIN * 60_000)
  istNow.setUTCHours(0, 0, 0, 0)
  istNow.setUTCDate(istNow.getUTCDate() - daysAgo)
  return new Date(istNow.getTime() - IST_OFFSET_MIN * 60_000)
}
