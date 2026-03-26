'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCategories } from '@/hooks/useTransactions'
import { useCreateBudget } from '@/hooks/useBudgets'
import { useUIStore } from '@/stores/ui-store'
import type { Budget } from '@/types'

interface BudgetFormModalProps {
  isOpen: boolean
  onClose: () => void
  month: number
  year: number
  budget?: Budget
}

export function BudgetFormModal({ isOpen, onClose, month, year, budget }: BudgetFormModalProps) {
  const { data: categories = [] } = useCategories()
  const createBudget = useCreateBudget()
  const addToast = useUIStore((s) => s.addToast)

  const [categoryId, setCategoryId] = useState<string | null>(budget?.category_id ?? null)
  const [amount, setAmount] = useState(budget?.amount?.toString() ?? '')

  useEffect(() => {
    if (isOpen) {
      setCategoryId(budget?.category_id ?? null)
      setAmount(budget?.amount?.toString() ?? '')
    }
  }, [isOpen, budget])

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  async function handleSave() {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) {
      addToast('Please enter a valid amount', 'error')
      return
    }

    try {
      await createBudget.mutateAsync({
        category_id: categoryId,
        amount: parsed,
        month,
        year,
      })
      addToast(budget ? 'Budget updated' : 'Budget created', 'success')
      onClose()
    } catch {
      addToast('Failed to save budget', 'error')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-elevated dark:bg-slate-800"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {budget ? 'Edit Budget' : 'Add Budget'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={categoryId ?? '__overall__'}
                  onChange={(e) => setCategoryId(e.target.value === '__overall__' ? null : e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="__overall__">Overall (All categories)</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Budget Amount
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                  <span className="text-sm font-medium text-slate-400 dark:text-slate-500">CAD$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value
                      if (/^\d*\.?\d{0,2}$/.test(val) || val === '') {
                        setAmount(val)
                      }
                    }}
                    className="w-full bg-transparent text-lg font-bold text-slate-900 outline-none placeholder:text-slate-300 dark:text-slate-100 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSave}
                disabled={createBudget.isPending}
              >
                {createBudget.isPending ? 'Saving...' : 'Save Budget'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
