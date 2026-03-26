'use client'

import { cn } from '@/lib/utils'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import type { Account, CreditCard, SourceType } from '@/types'

interface SourceChipsProps {
  accounts: Account[]
  creditCards: CreditCard[]
  selectedSourceType: SourceType | null
  selectedSourceId: string | null
  onSelect: (sourceType: SourceType, sourceId: string) => void
}

function abbreviateBalance(amount: number | string): string {
  const num = Number(amount)
  const abs = Math.abs(num)
  if (abs >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`
  }
  return `$${num.toFixed(0)}`
}

export function SourceChips({
  accounts,
  creditCards,
  selectedSourceType,
  selectedSourceId,
  onSelect,
}: SourceChipsProps) {
  const activeAccounts = accounts.filter((a) => a.is_active)
  const activeCards = creditCards.filter((c) => c.is_active)

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {activeAccounts.map((acc) => (
        <button
          key={acc.id}
          type="button"
          onClick={() => onSelect('account', acc.id)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
            selectedSourceType === 'account' && selectedSourceId === acc.id
              ? 'border-accent-500 bg-accent-50 text-accent-700 ring-2 ring-accent-500 dark:bg-accent-950 dark:text-accent-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          )}
        >
          <DynamicIcon name={acc.icon} size={14} />
          <span className="whitespace-nowrap">{acc.name}</span>
          <span className="text-slate-400 dark:text-slate-500">{abbreviateBalance(acc.balance)}</span>
        </button>
      ))}

      {activeAccounts.length > 0 && activeCards.length > 0 && (
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          |
        </span>
      )}

      {activeCards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => onSelect('credit_card', card.id)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
            selectedSourceType === 'credit_card' && selectedSourceId === card.id
              ? 'border-accent-500 bg-accent-50 text-accent-700 ring-2 ring-accent-500 dark:bg-accent-950 dark:text-accent-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          )}
        >
          <DynamicIcon name={card.icon} size={14} />
          <span className="whitespace-nowrap">{card.name}</span>
          <span className="text-slate-400 dark:text-slate-500">
            {abbreviateBalance(card.outstanding_balance)}
          </span>
        </button>
      ))}
    </div>
  )
}
