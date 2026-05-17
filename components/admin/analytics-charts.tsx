'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

const PRIMARY = '#f97316'
const ACCENT = '#fb923c'

const tooltipStyle = {
  background: 'var(--card, #fff)',
  border: '1px solid var(--border, #e5e7eb)',
  borderRadius: 8,
  fontSize: 12,
}

/** Students enrolled per course. */
export function CourseEngagementChart({
  data,
}: {
  data: { name: string; students: number }[]
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No courses yet.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="students" fill={PRIMARY} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Daily active users over the last 7 days. */
export function ActivityTrendChart({
  data,
}: {
  data: { day: string; users: number }[]
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
        <defs>
          <linearGradient id="dau" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={ACCENT} stopOpacity={0.4} />
            <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e5e7eb)" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type="monotone"
          dataKey="users"
          stroke={ACCENT}
          strokeWidth={2}
          fill="url(#dau)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
