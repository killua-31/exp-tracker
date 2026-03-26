'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/loading-skeleton'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import { useAccounts } from '@/hooks/useAccounts'
import { formatCurrency } from '@/lib/utils'

export function AccountsStrip() {
  const { data: accounts, isLoading } = useAccounts()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Accounts</h2>
        <Link
          href="/accounts"
          className="text-sm text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
        >
          View All
        </Link>
      </div>
      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
        {isLoading
          ? [0, 1, 2].map((i) => (
              <Card key={i} className="min-w-[180px] shrink-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="min-w-0 space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              </Card>
            ))
          : accounts?.map((account) => (
              <div
                key={account.id}
                className="min-w-[180px] shrink-0 rounded-2xl border-l-4 overflow-hidden"
                style={{ borderLeftColor: account.color }}
              >
                <Card className="rounded-l-none">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-lg shrink-0"
                      style={{ backgroundColor: account.color + '20', color: account.color }}
                    >
                      <DynamicIcon name={account.icon} size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {account.name}
                      </p>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
      </div>
    </div>
  )
}
