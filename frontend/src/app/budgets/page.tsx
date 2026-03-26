'use client'

import { useState } from 'react'
import { PiggyBank, Plus } from 'lucide-react'
import { MonthSelector } from '@/components/budgets/month-selector'
import { BudgetOverview } from '@/components/budgets/budget-overview'
import { BudgetCategoryRow } from '@/components/budgets/budget-category-row'
import { BudgetFormModal } from '@/components/budgets/budget-form-modal'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useBudgetStatus } from '@/hooks/useBudgets'
import { useDeleteBudget } from '@/hooks/useBudgets'
import { useCategories } from '@/hooks/useTransactions'
import { useUIStore } from '@/stores/ui-store'
import type { Budget } from '@/types'

export default function BudgetsPage() {
  const [month, setMonth] = useState(3)
  const [year, setYear] = useState(2026)
  const [formOpen, setFormOpen] = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | undefined>()

  const { data: budgetStatus = [] } = useBudgetStatus(month, year)
  const { data: categories = [] } = useCategories()
  const deleteBudget = useDeleteBudget()
  const addToast = useUIStore((s) => s.addToast)

  const categoryStatuses = budgetStatus.filter((s) => s.budget.category_id !== null)

  function handleMonthChange(m: number, y: number) {
    setMonth(m)
    setYear(y)
  }

  function handleEdit(budget: Budget) {
    setEditBudget(budget)
    setFormOpen(true)
  }

  async function handleDelete(budgetId: string) {
    const confirmed = window.confirm('Are you sure you want to delete this budget?')
    if (!confirmed) return
    try {
      await deleteBudget.mutateAsync(budgetId)
      addToast('Budget deleted', 'success')
    } catch {
      addToast('Failed to delete budget', 'error')
    }
  }

  function handleAddNew() {
    setEditBudget(undefined)
    setFormOpen(true)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24">
      <MonthSelector month={month} year={year} onChange={handleMonthChange} />

      <BudgetOverview budgetStatus={budgetStatus} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Category Budgets
        </h2>
        <Button variant="primary" size="sm" onClick={handleAddNew}>
          <Plus className="h-4 w-4" />
          Add Budget
        </Button>
      </div>

      {categoryStatuses.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No category budgets"
          description="Set budgets for specific categories to track spending."
          actionLabel="Add Budget"
          onAction={handleAddNew}
        />
      ) : (
        <div className="space-y-3">
          {categoryStatuses.map((status) => (
            <BudgetCategoryRow
              key={status.budget.id}
              status={status}
              categories={categories}
              onEdit={() => handleEdit(status.budget)}
              onDelete={() => handleDelete(status.budget.id)}
            />
          ))}
        </div>
      )}

      <BudgetFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        month={month}
        year={year}
        budget={editBudget}
      />
    </div>
  )
}
