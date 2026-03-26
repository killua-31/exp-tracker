'use client'

import { ProgressBar } from '@/components/ui/progress-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { CreditCard } from '@/types'

interface CreditCardCardProps {
  card: CreditCard
  onClick?: () => void
  onPayBill?: () => void
}

export function CreditCardCard({ card, onClick, onPayBill }: CreditCardCardProps) {
  const utilization = card.credit_limit > 0
    ? (card.outstanding_balance / card.credit_limit) * 100
    : 0
  const available = card.credit_limit - card.outstanding_balance

  return (
    <div
      className="overflow-hidden rounded-2xl p-5 shadow-card transition-all hover:shadow-soft cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)`,
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onClick) onClick() }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{card.name}</h3>
          {card.issuer && (
            <Badge color="#ffffff" className="mt-1 text-white/90 bg-white/20">
              {card.issuer}
            </Badge>
          )}
        </div>
        {card.network && (
          <span className="text-sm font-medium text-white/70">{card.network}</span>
        )}
      </div>

      {/* Utilization bar */}
      <div className="mb-1 flex items-center justify-between text-xs text-white/80">
        <span>Utilization</span>
        <span>{utilization.toFixed(0)}%</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-all"
          style={{ width: `${Math.min(utilization, 100)}%` }}
        />
      </div>

      {/* Metric chips */}
      <div className="mb-4 flex gap-2">
        <div className="flex-1 rounded-xl bg-white/15 px-3 py-2 text-center">
          <p className="text-[10px] font-medium uppercase text-white/70">Outstanding</p>
          <p className="text-sm font-bold text-white">{formatCurrency(card.outstanding_balance)}</p>
        </div>
        <div className="flex-1 rounded-xl bg-white/15 px-3 py-2 text-center">
          <p className="text-[10px] font-medium uppercase text-white/70">Available</p>
          <p className="text-sm font-bold text-white">{formatCurrency(available)}</p>
        </div>
        <div className="flex-1 rounded-xl bg-white/15 px-3 py-2 text-center">
          <p className="text-[10px] font-medium uppercase text-white/70">Limit</p>
          <p className="text-sm font-bold text-white">{formatCurrency(card.credit_limit)}</p>
        </div>
      </div>

      {/* Due/Statement info */}
      {(card.due_day || card.statement_day) && (
        <div className="mb-3 flex gap-3 text-xs text-white/70">
          {card.statement_day && <span>Statement: Day {card.statement_day}</span>}
          {card.due_day && <span>Due: Day {card.due_day}</span>}
        </div>
      )}

      {/* Pay Bill button */}
      {card.outstanding_balance > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPayBill?.()
          }}
          className="w-full rounded-xl bg-white/20 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/30"
        >
          Pay Bill
        </button>
      )}
    </div>
  )
}
