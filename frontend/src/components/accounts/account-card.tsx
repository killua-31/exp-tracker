'use client'

import { Wallet } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { Account } from '@/types'

interface AccountCardProps {
  account: Account
  onClick?: () => void
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  return (
    <Card
      className="relative overflow-hidden"
      onClick={onClick}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: account.color }}
      />
      <div className="flex items-center gap-3 pl-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: account.color + '22', color: account.color }}
        >
          <Wallet className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {account.name}
            </span>
            <Badge color={account.color}>
              {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
            </Badge>
          </div>
        </div>
        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {formatCurrency(account.balance, account.currency)}
        </span>
      </div>
    </Card>
  )
}
