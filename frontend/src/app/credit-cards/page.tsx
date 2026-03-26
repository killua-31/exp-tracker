'use client'

import { useState } from 'react'
import { CreditCard as CreditCardIcon, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/loading-skeleton'
import { CreditCardCard } from '@/components/credit-cards/credit-card-card'
import { CreditCardFormModal } from '@/components/credit-cards/credit-card-form-modal'
import { PayBillModal } from '@/components/credit-cards/pay-bill-modal'
import { useCreditCards } from '@/hooks/useAccounts'
import { formatCurrency } from '@/lib/utils'
import type { CreditCard } from '@/types'

export default function CreditCardsPage() {
  const { data: cards = [], isLoading } = useCreditCards()
  const [formOpen, setFormOpen] = useState(false)
  const [editCard, setEditCard] = useState<CreditCard | undefined>()
  const [payCard, setPayCard] = useState<CreditCard | null>(null)
  const [payOpen, setPayOpen] = useState(false)

  const totalUsed = cards.reduce((sum, c) => sum + c.outstanding_balance, 0)
  const totalLimit = cards.reduce((sum, c) => sum + c.credit_limit, 0)
  const totalUtilization = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0

  function handleEdit(card: CreditCard) {
    setEditCard(card)
    setFormOpen(true)
  }

  function handleAdd() {
    setEditCard(undefined)
    setFormOpen(true)
  }

  function handleFormClose() {
    setFormOpen(false)
    setEditCard(undefined)
  }

  function handlePayBill(card: CreditCard) {
    setPayCard(card)
    setPayOpen(true)
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto pb-24">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full mb-3" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </Card>
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-32 mb-3" />
              <Skeleton className="h-2 w-full rounded-full mb-2" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Credit Cards</h1>
        <Button variant="primary" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          Add Card
        </Button>
      </div>

      {/* Total Credit Summary */}
      <Card className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Total Credit Used
          </span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {totalUtilization.toFixed(0)}%
          </span>
        </div>
        <ProgressBar value={totalUtilization} className="mb-3" />
        <div className="flex justify-between text-sm">
          <span className="text-slate-900 dark:text-slate-100">
            <span className="font-semibold">{formatCurrency(totalUsed)}</span> used
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            of {formatCurrency(totalLimit)}
          </span>
        </div>
      </Card>

      {cards.length === 0 ? (
        <EmptyState
          icon={CreditCardIcon}
          title="No credit cards yet"
          description="Add your credit cards to track spending and payments."
          actionLabel="Add Card"
          onAction={handleAdd}
        />
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <CreditCardCard
              key={card.id}
              card={card}
              onClick={() => handleEdit(card)}
              onPayBill={() => handlePayBill(card)}
            />
          ))}
        </div>
      )}

      <CreditCardFormModal
        isOpen={formOpen}
        onClose={handleFormClose}
        card={editCard}
      />

      <PayBillModal
        isOpen={payOpen}
        onClose={() => { setPayOpen(false); setPayCard(null) }}
        card={payCard}
      />
    </div>
  )
}
