'use client'

import { useState, useCallback, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CategoryGridModal } from '@/components/transactions/category-grid-modal'
import { useAccounts, useCreditCards } from '@/hooks/useAccounts'
import {
  useCategories,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/useTransactions'
import { useUIStore } from '@/stores/ui-store'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import type { Transaction, TransactionType } from '@/types'

const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'card_payment', label: 'Card Payment' },
]

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

interface TransactionFormProps {
  initialData?: Transaction
  onSuccess?: () => void
}

export function TransactionForm({ initialData, onSuccess }: TransactionFormProps) {
  const router = useRouter()
  const addToast = useUIStore((s) => s.addToast)
  const isEdit = !!initialData

  const [type, setType] = useState<TransactionType>(initialData?.type ?? 'expense')
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.category_id ?? null)
  const [sourceType, setSourceType] = useState(initialData?.source_type ?? 'account')
  const [sourceId, setSourceId] = useState(initialData?.source_id ?? '')
  const [destinationType, setDestinationType] = useState(initialData?.destination_type ?? null)
  const [destinationId, setDestinationId] = useState(initialData?.destination_id ?? '')
  const [merchant, setMerchant] = useState(initialData?.merchant ?? '')
  const [date, setDate] = useState(initialData?.date?.split('T')[0] ?? todayISO())
  const [note, setNote] = useState(initialData?.note ?? '')
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [isRecurring, setIsRecurring] = useState(initialData?.is_recurring ?? false)
  const [recurringFrequency, setRecurringFrequency] = useState<string>(
    (initialData?.recurring_rule as Record<string, string>)?.frequency ?? 'monthly'
  )
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  const { data: accounts = [] } = useAccounts()
  const { data: creditCards = [] } = useCreditCards()
  const { data: categories = [] } = useCategories()

  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()

  // Set defaults for source when data loads
  const sourceLabel = type === 'income' ? 'To' : 'From'
  const showDestination = type === 'transfer' || type === 'card_payment'
  const showCategory = type === 'expense' || type === 'income'

  const selectedCategory = categories.find((c) => c.id === categoryId)

  function handleTypeChange(newType: TransactionType) {
    setType(newType)
    setCategoryId(null)
    if (newType === 'transfer') {
      setDestinationType('account')
      setDestinationId('')
    } else if (newType === 'card_payment') {
      setDestinationType('credit_card')
      setDestinationId('')
    } else {
      setDestinationType(null)
      setDestinationId('')
    }
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().replace(/,/g, '')
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag])
      }
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSourceChange = useCallback((value: string) => {
    const [sType, sId] = value.split('::')
    setSourceType(sType as 'account' | 'credit_card')
    setSourceId(sId)
  }, [])

  const handleDestinationChange = useCallback((value: string) => {
    const [dType, dId] = value.split('::')
    setDestinationType(dType as 'account' | 'credit_card')
    setDestinationId(dId)
  }, [])

  async function handleSave() {
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      addToast('Please enter a valid amount', 'error')
      return
    }
    if (!sourceId) {
      addToast('Please select a source', 'error')
      return
    }
    if (showDestination && !destinationId) {
      addToast('Please select a destination', 'error')
      return
    }

    const payload: Partial<Transaction> = {
      type,
      amount: parsedAmount,
      currency: 'CAD',
      category_id: showCategory ? categoryId : null,
      source_type: sourceType as 'account' | 'credit_card',
      source_id: sourceId,
      destination_type: showDestination ? (destinationType as 'account' | 'credit_card') : null,
      destination_id: showDestination ? destinationId : null,
      merchant: merchant || null,
      date,
      note: note || null,
      tags,
      is_recurring: isRecurring,
      recurring_rule: isRecurring ? { frequency: recurringFrequency } : null,
    }

    try {
      if (isEdit && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload })
        addToast('Transaction updated', 'success')
      } else {
        await createMutation.mutateAsync(payload)
        addToast('Transaction created', 'success')
      }
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/transactions')
      }
    } catch {
      addToast('Failed to save transaction', 'error')
    }
  }

  async function handleDelete() {
    if (!initialData) return
    const confirmed = window.confirm('Are you sure you want to delete this transaction?')
    if (!confirmed) return

    try {
      await deleteMutation.mutateAsync(initialData.id)
      addToast('Transaction deleted', 'success')
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/transactions')
      }
    } catch {
      addToast('Failed to delete transaction', 'error')
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-5">
      {/* Type Selector */}
      <div className="flex gap-2">
        {TRANSACTION_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => handleTypeChange(t.value)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
              type === t.value
                ? 'bg-accent-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Amount */}
      <Card className="flex items-center gap-2">
        <span className="text-lg font-medium text-slate-500">CAD$</span>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="0.00"
          className="flex-1 bg-transparent text-3xl font-bold text-slate-900 outline-none placeholder:text-slate-300 dark:text-slate-100 dark:placeholder:text-slate-600"
        />
      </Card>

      {/* Category Picker */}
      {showCategory && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Category
          </label>
          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {selectedCategory ? (
              <>
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ backgroundColor: selectedCategory.color + '22', color: selectedCategory.color }}
                >
                  <DynamicIcon name={selectedCategory.icon} size={16} />
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {selectedCategory.name}
                </span>
              </>
            ) : (
              <span className="text-slate-400">Select category</span>
            )}
          </button>
          <CategoryGridModal
            isOpen={categoryModalOpen}
            onClose={() => setCategoryModalOpen(false)}
            onSelect={(id) => setCategoryId(id)}
            categories={categories.filter((c) =>
              type === 'income' ? c.type === 'income' : c.type === 'expense'
            )}
          />
        </div>
      )}

      {/* Source */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {sourceLabel}
        </label>
        <select
          value={sourceId ? `${sourceType}::${sourceId}` : ''}
          onChange={(e) => handleSourceChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">Select source</option>
          <optgroup label="Accounts">
            {accounts.map((a) => (
              <option key={a.id} value={`account::${a.id}`}>
                {a.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Credit Cards">
            {creditCards.map((c) => (
              <option key={c.id} value={`credit_card::${c.id}`}>
                {c.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Destination */}
      {showDestination && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            To
          </label>
          <select
            value={destinationId ? `${destinationType}::${destinationId}` : ''}
            onChange={(e) => handleDestinationChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Select destination</option>
            {type === 'transfer' ? (
              <optgroup label="Accounts">
                {accounts.map((a) => (
                  <option key={a.id} value={`account::${a.id}`}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            ) : (
              <optgroup label="Credit Cards">
                {creditCards.map((c) => (
                  <option key={c.id} value={`credit_card::${c.id}`}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      )}

      {/* Merchant */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Merchant
        </label>
        <input
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="Merchant / Payee"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Date */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Note */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Note
        </label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Tags
        </label>
        {tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700 dark:bg-accent-900/30 dark:text-accent-300"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 text-accent-500 hover:text-accent-700"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          placeholder="Type and press Enter to add tags"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {/* Recurring */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Recurring</span>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent-600 peer-checked:after:translate-x-full dark:bg-slate-600" />
        </label>
      </div>
      {isRecurring && (
        <select
          value={recurringFrequency}
          onChange={(e) => setRecurringFrequency(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="w-full py-2 text-center text-sm font-medium text-expense-500 hover:text-expense-600"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Transaction'}
          </button>
        )}
      </div>
    </div>
  )
}
