'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '@/components/ui/card'
import { useSpendingByCategory } from '@/hooks/useDashboard'
import { formatCurrency } from '@/lib/utils'

// TODO: Use actual current date in production
const MONTH = 3
const YEAR = 2026

export function SpendingChart() {
  const { data: spending, isLoading } = useSpendingByCategory(MONTH, YEAR)

  if (isLoading) {
    return <Card className="animate-pulse h-[360px]"><span /></Card>
  }

  const chartData = spending ?? []
  const total = chartData.reduce((sum, item) => sum + item.amount, 0)

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Spending by Category
      </h3>
      {chartData.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">
          No spending data for this month
        </p>
      ) : (
        <>
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="category_name"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.category_name} fill={entry.category_color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">Total</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(total)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {chartData.map((item) => (
              <div key={item.category_name} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.category_color }}
                />
                <span className="text-slate-600 dark:text-slate-400 truncate">
                  {item.category_name}
                </span>
                <span className="ml-auto text-slate-900 dark:text-slate-100 font-medium shrink-0">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
