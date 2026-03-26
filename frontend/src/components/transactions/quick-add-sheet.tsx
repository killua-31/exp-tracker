'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { CategoryChips } from './category-chips'
import { SourceChips } from './source-chips'
import { CategoryGridModal } from './category-grid-modal'
import { useUIStore } from '@/stores/ui-store'
import { useCategories } from '@/hooks/useTransactions'
import { useAccounts, useCreditCards } from '@/hooks/useAccounts'
import { createQuickTransaction } from '@/lib/api'
import type { SourceType, CategoryType } from '@/types'
import { cn } from '@/lib/utils'

function todayString(): string {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

export function QuickAddSheet() {
  const { quickAddOpen, closeQuickAdd, addToast } = useUIStore()
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()
  const { data: creditCards = [] } = useCreditCards()

  const [type, setType] = useState<CategoryType>('expense')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [sourceType, setSourceType] = useState<SourceType | null>(null)
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [merchant, setMerchant] = useState('')
  const [date, setDate] = useState(todayString)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [showCategoryGrid, setShowCategoryGrid] = useState(false)

  const amountRef = useRef<HTMLInputElement>(null)

  // Pre-select first account when data loads
  useEffect(() => {
    if (!sourceId && accounts.length > 0) {
      const firstActive = accounts.find((a) => a.is_active)
      if (firstActive) {
        setSourceType('account')
        setSourceId(firstActive.id)
      }
    }
  }, [accounts, sourceId])

  // Auto-focus amount when sheet opens
  useEffect(() => {
    if (quickAddOpen) {
      setTimeout(() => amountRef.current?.focus(), 300)
    }
  }, [quickAddOpen])

  const resetForm = useCallback(() => {
    setType('expense')
    setCategoryId(null)
    setAmount('')
    setSourceType(null)
    setSourceId(null)
    setMerchant('')
    setDate(todayString())
    setNote('')
    setShowNote(false)
    setShowCategoryGrid(false)
  }, [])

  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createQuickTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      closeQuickAdd()
      addToast('Transaction saved!', 'success')
      resetForm()
    },
    onError: (error: Error) => {
      addToast(error.message || 'Failed to save transaction', 'error')
    },
  })

  function handleTypeSwitch(newType: CategoryType) {
    setType(newType)
    setCategoryId(null)
  }

  function handleSourceSelect(st: SourceType, sid: string) {
    setSourceType(st)
    setSourceId(sid)
  }

  function handleSave() {
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || !categoryId || !sourceType || !sourceId) return

    mutation.mutate({
      type,
      amount: parsedAmount,
      category_id: categoryId,
      source_type: sourceType,
      source_id: sourceId,
      merchant: merchant || undefined,
      date,
      note: note || undefined,
    } as Parameters<typeof createQuickTransaction>[0])
  }

  const canSave = parseFloat(amount) > 0 && categoryId && sourceId

  return (
    <>
      <BottomSheet
        isOpen={quickAddOpen}
        onClose={closeQuickAdd}
        className="max-h-[55vh]"
      >
        <div className="flex flex-col gap-4">
          {/* Type toggle */}
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleTypeSwitch('expense')}
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                type === 'expense'
                  ? 'bg-expense-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              )}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('income')}
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-semibold transition-all',
                type === 'income'
                  ? 'bg-income-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              )}
            >
              Income
            </button>
          </div>

          {/* Category chips */}
          <CategoryChips
            selectedId={categoryId}
            onSelect={setCategoryId}
            type={type}
            categories={categories}
            onMoreClick={() => setShowCategoryGrid(true)}
          />

          {/* Amount input */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <span className="text-sm font-medium text-slate-400 dark:text-slate-500">CAD$</span>
            <input
              ref={amountRef}
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
              className="w-full bg-transparent text-2xl font-bold text-slate-900 outline-none placeholder:text-slate-300 dark:text-slate-100 dark:placeholder:text-slate-600"
            />
          </div>

          {/* Source chips */}
          <SourceChips
            accounts={accounts}
            creditCards={creditCards}
            selectedSourceType={sourceType}
            selectedSourceId={sourceId}
            onSelect={handleSourceSelect}
          />

          {/* Merchant + Date row */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Merchant"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-[140px] shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Note toggle + textarea */}
          <div>
            {!showNote ? (
              <button
                type="button"
                onClick={() => setShowNote(true)}
                className="text-sm font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400"
              >
                + Add note
              </button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <textarea
                    placeholder="Add a note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || mutation.isPending}
            className={cn(
              'w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all',
              type === 'expense'
                ? 'bg-expense-500 hover:bg-expense-600'
                : 'bg-income-500 hover:bg-income-600',
              (!canSave || mutation.isPending) && 'cursor-not-allowed opacity-50'
            )}
          >
            {mutation.isPending
              ? 'Saving...'
              : type === 'expense'
                ? 'Save Expense'
                : 'Save Income'}
          </button>
        </div>
      </BottomSheet>

      {/* Category grid modal */}
      <CategoryGridModal
        isOpen={showCategoryGrid}
        onClose={() => setShowCategoryGrid(false)}
        onSelect={(id) => {
          setCategoryId(id)
          setShowCategoryGrid(false)
        }}
        categories={categories}
      />
    </>
  )
}
