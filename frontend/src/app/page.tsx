'use client'

import { SummaryCards } from '@/components/dashboard/summary-cards'
import { AccountsStrip } from '@/components/dashboard/accounts-strip'
import { CreditCardsStrip } from '@/components/dashboard/credit-cards-strip'
import { MonthlyOverview } from '@/components/dashboard/monthly-overview'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { TrendChart } from '@/components/dashboard/trend-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { BudgetHealth } from '@/components/dashboard/budget-health'

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
      <SummaryCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountsStrip />
        <CreditCardsStrip />
      </div>
      <MonthlyOverview />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingChart />
        <TrendChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions />
        <BudgetHealth />
      </div>
    </div>
  )
}
