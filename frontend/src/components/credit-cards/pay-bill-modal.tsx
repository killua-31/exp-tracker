'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/hooks/useAccounts'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useUIStore } from '@/stores/ui-store'
import { formatCurrency } from '@/lib/utils'
import type { CreditCard } from '@/types'

interface PayBillModalProps {
  isOpen: boolean
  onClose: () => void
  card: CreditCard | null
}

export function PayBillModal({ isOpen, onClose, card }: PayBillModalProps) {
  const addToast = useUIStore((s) => s.addToast)
  const { data: accounts = [] } = useAccounts()
  const createTransaction = useCreateTransaction()

  const [amount, setAmount] = useState('')
  const [sourceAccountId, setSourceAccountId] = useState('')

  useEffect(() => {
    if (card) {
      setAmount(String(Number(card.outstanding_balance)))
    }
    setSourceAccountId('')
  }, [card, isOpen])

  async function handlePay() {
    if (!card) return
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      addToast('Please enter a valid amount', 'error')
      return
    }
    if (!sourceAccountId) {
      addToast('Please select a source account', 'error')
      return
    }

    try {
      await createTransaction.mutateAsync({
        type: 'card_payment',
        amount: parsedAmount,
        currency: 'CAD',
        source_type: 'account',
        source_id: sourceAccountId,
        destination_type: 'credit_card',
        destination_id: card.id,
        date: new Date().toISOString().split('T')[0],
        merchant: `Payment to ${card.name}`,
        tags: [],
        is_recurring: false,
      })
      addToast('Payment recorded', 'success')
      onClose()
    } catch {
      addToast('Failed to record payment', 'error')
    }
  }

  if (!card) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-4 top-1/2 z-50 max-w-md mx-auto -translate-y-1/2 rounded-2xl bg-white p-6 shadow-elevated dark:bg-slate-900"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Pay {card.name}
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Outstanding balance:{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(card.outstanding_balance)}
              </span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  From Account
                </label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handlePay}
                disabled={createTransaction.isPending}
              >
                {createTransaction.isPending ? 'Paying...' : 'Pay'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
