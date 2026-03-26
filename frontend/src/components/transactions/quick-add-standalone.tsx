'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { CategoryChips } from './category-chips'
import { SourceChips } from './source-chips'
import { CategoryGridModal } from './category-grid-modal'
import { useCategories } from '@/hooks/useTransactions'
import { useAccounts, useCreditCards } from '@/hooks/useAccounts'
import { createQuickTransaction } from '@/lib/api'
import type { SourceType, CategoryType } from '@/types'
import { cn } from '@/lib/utils'

function todayString(): string {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

export function QuickAddStandalone() {
  const searchParams = useSearchParams()
  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()
  const { data: creditCards = [] } = useCreditCards()

  const paramAmount = searchParams.get('amount') ?? ''
  const paramCategory = searchParams.get('category') ?? ''
  const paramSource = searchParams.get('source') ?? ''
  const paramType = searchParams.get('type') as CategoryType | null

  const [type, setType] = useState<CategoryType>(paramType === 'income' ? 'income' : 'expense')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [amount, setAmount] = useState(paramAmount)
  const [sourceType, setSourceType] = useState<SourceType | null>(null)
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [merchant, setMerchant] = useState('')
  const [date, setDate] = useState(todayString)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [showCategoryGrid, setShowCategoryGrid] = useState(false)
  const [saved, setSaved] = useState(false)

  const amountRef = useRef<HTMLInputElement>(null)

  // Resolve category from param (name or id)
  useEffect(() => {
    if (paramCategory && categories.length > 0) {
      const found = categories.find(
        (c) => c.id === paramCategory || c.name.toLowerCase() === paramCategory.toLowerCase()
      )
      if (found) setCategoryId(found.id)
    }
  }, [paramCategory, categories])

  // Resolve source from param (name or id)
  useEffect(() => {
    if (paramSource && (accounts.length > 0 || creditCards.length > 0)) {
      const acc = accounts.find(
        (a) => a.id === paramSource || a.name.toLowerCase() === paramSource.toLowerCase()
      )
      if (acc) {
        setSourceType('account')
        setSourceId(acc.id)
        return
      }
      const card = creditCards.find(
        (c) => c.id === paramSource || c.name.toLowerCase() === paramSource.toLowerCase()
      )
      if (card) {
        setSourceType('credit_card')
        setSourceId(card.id)
      }
    }
  }, [paramSource, accounts, creditCards])

  // Pre-select first account when data loads
  useEffect(() => {
    if (!sourceId && !paramSource && accounts.length > 0) {
      const firstActive = accounts.find((a) => a.is_active)
      if (firstActive) {
        setSourceType('account')
        setSourceId(firstActive.id)
      }
    }
  }, [accounts, sourceId, paramSource])

  useEffect(() => {
    setTimeout(() => amountRef.current?.focus(), 100)
  }, [])

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
    setSaved(false)
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
      setSaved(true)
    },
    onError: () => {
      // error handled inline
    },
  })

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

  if (saved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-income-100 dark:bg-income-900/30"
          >
            <Check className="h-10 w-10 text-income-600 dark:text-income-400" />
          </motion.div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Transaction Saved!
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your transaction has been recorded.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl bg-accent-600 px-6 py-3 text-sm font-semibold text-white hover:bg-accent-700"
            >
              Add Another
            </button>
            <a
              href="/"
              className="text-sm font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-slate-50 p-4 pt-12 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-elevated dark:bg-slate-800">
        <h1 className="mb-6 text-xl font-bold text-slate-900 dark:text-slate-100">Quick Add</h1>

        <div className="flex flex-col gap-4">
          {/* Type toggle */}
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-700">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId(null) }}
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
              onClick={() => { setType('income'); setCategoryId(null) }}
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
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
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
            onSelect={(st, sid) => { setSourceType(st); setSourceId(sid) }}
          />

          {/* Merchant + Date row */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Merchant"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-[140px] shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Error */}
          {mutation.isError && (
            <p className="text-sm text-expense-500">
              {mutation.error?.message || 'Failed to save transaction'}
            </p>
          )}

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
      </div>

      <CategoryGridModal
        isOpen={showCategoryGrid}
        onClose={() => setShowCategoryGrid(false)}
        onSelect={(id) => {
          setCategoryId(id)
          setShowCategoryGrid(false)
        }}
        categories={categories}
      />
    </div>
  )
}
