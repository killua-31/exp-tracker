'use client'

import { useState } from 'react'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCategories } from '@/hooks/useTransactions'
import { createCategory } from '@/lib/api'
import { useUIStore } from '@/stores/ui-store'
import type { CategoryType } from '@/types'

const DEFAULT_COLORS = [
  '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

export function CategoryManager() {
  const { data: categories = [] } = useCategories()
  const addToast = useUIStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<CategoryType>('expense')
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0])

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      addToast('Category created', 'success')
      setNewName('')
      setShowAddForm(false)
    },
    onError: () => {
      addToast('Failed to create category', 'error')
    },
  })

  const expenseCategories = categories
    .filter((c) => c.type === 'expense')
    .sort((a, b) => a.sort_order - b.sort_order)

  const incomeCategories = categories
    .filter((c) => c.type === 'income')
    .sort((a, b) => a.sort_order - b.sort_order)

  function handleCreate() {
    if (!newName.trim()) return
    createMutation.mutate({
      name: newName.trim(),
      type: newType,
      color: newColor,
      icon: newType === 'expense' ? '📦' : '💰',
      sort_order: 99,
    })
  }

  return (
    <div className="space-y-6">
      {/* Expenses */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Expenses
        </h3>
        <div className="space-y-1">
          {expenseCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 text-sm text-slate-900 dark:text-slate-100">
                {cat.icon} {cat.name}
              </span>
              {cat.is_default && (
                <span className="text-xs text-slate-400 dark:text-slate-500">Default</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Income */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Income
        </h3>
        <div className="space-y-1">
          {incomeCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 text-sm text-slate-900 dark:text-slate-100">
                {cat.icon} {cat.name}
              </span>
              {cat.is_default && (
                <span className="text-xs text-slate-400 dark:text-slate-500">Default</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Category */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 text-sm font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <input
            type="text"
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            autoFocus
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNewType('expense')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${
                newType === 'expense'
                  ? 'bg-expense-100 text-expense-700 dark:bg-expense-900/30 dark:text-expense-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setNewType('income')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${
                newType === 'income'
                  ? 'bg-income-100 text-income-700 dark:bg-income-900/30 dark:text-income-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              Income
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {DEFAULT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                className={`h-7 w-7 rounded-full border-2 ${
                  newColor === color ? 'border-slate-900 dark:border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={createMutation.isPending || !newName.trim()}
              className="flex items-center gap-1 rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-700 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
