'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { useTrends } from '@/hooks/useDashboard'
import { formatCurrency } from '@/lib/utils'

export function TrendChart() {
  const { data: trends, isLoading } = useTrends(6)

  if (isLoading) {
    return <Card className="animate-pulse h-[360px]"><span /></Card>
  }

  const chartData = trends ?? []

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        6 Month Trend
      </h3>
      {chartData.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">
          No trend data available
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-income-500)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-income-500)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-expense-500)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-expense-500)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              stroke="#94a3b8"
            />
            <YAxis
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
              stroke="#94a3b8"
              width={50}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                String(name).charAt(0).toUpperCase() + String(name).slice(1),
              ]}
              contentStyle={{
                borderRadius: '0.75rem',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="var(--color-income-500)"
              fill="url(#incomeGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="var(--color-expense-500)"
              fill="url(#expenseGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
