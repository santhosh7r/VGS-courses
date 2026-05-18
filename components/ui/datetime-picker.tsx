'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Date + 12-hour time picker.
 *
 * The native <input type="datetime-local"> / <input type="time"> controls
 * render in the browser's locale — often 24-hour ("railway time"). This picker
 * always uses an explicit 12-hour hour / minute / AM-PM selection.
 *
 * It emits a 'YYYY-MM-DDTHH:mm' string (24-hour, local time) — exactly what
 * `new Date(value)` expects — or '' while the selection is incomplete.
 */

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

function parseValue(value: string) {
  if (!value || !value.includes('T')) {
    return { date: '', hour: '', minute: '', ampm: 'AM' }
  }
  const [date, time] = value.split('T')
  const h = parseInt(time.slice(0, 2), 10)
  const minute = time.slice(3, 5)
  if (Number.isNaN(h)) return { date, hour: '', minute: '', ampm: 'AM' }
  return {
    date,
    hour: String(h % 12 || 12),
    minute,
    ampm: h >= 12 ? 'PM' : 'AM',
  }
}

const fieldClass =
  'h-9 rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none ' +
  'transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 ' +
  'focus-visible:ring-[3px] dark:bg-input/30'

export function DateTimePicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const initial = parseValue(value)
  const [date, setDate] = useState(initial.date)
  const [hour, setHour] = useState(initial.hour)
  const [minute, setMinute] = useState(initial.minute)
  const [ampm, setAmpm] = useState(initial.ampm)

  const commit = (d: string, h: string, m: string, ap: string) => {
    setDate(d)
    setHour(h)
    setMinute(m)
    setAmpm(ap)
    if (d && h && m) {
      let h24 = parseInt(h, 10) % 12
      if (ap === 'PM') h24 += 12
      onChange(`${d}T${String(h24).padStart(2, '0')}:${m}`)
    } else {
      // Incomplete selection — surface an empty value so form validation
      // can catch it instead of building an invalid date.
      onChange('')
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <input
        type="date"
        value={date}
        onChange={(e) => commit(e.target.value, hour, minute, ampm)}
        className={cn(fieldClass, 'min-w-[9rem] flex-1 px-3')}
      />
      <div className="flex items-center gap-1">
        <select
          aria-label="Hour"
          value={hour}
          onChange={(e) => commit(date, e.target.value, minute, ampm)}
          className={fieldClass}
        >
          <option value="">--</option>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground">:</span>
        <select
          aria-label="Minute"
          value={minute}
          onChange={(e) => commit(date, hour, e.target.value, ampm)}
          className={fieldClass}
        >
          <option value="">--</option>
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          aria-label="AM or PM"
          value={ampm}
          onChange={(e) => commit(date, hour, minute, e.target.value)}
          className={fieldClass}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  )
}
