'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { Category } from '@/types'

interface CategoryGridModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (id: string) => void
  categories: Category[]
}

export function CategoryGridModal({ isOpen, onClose, onSelect, categories }: CategoryGridModalProps) {
  const expenseCategories = categories
    .filter((c) => c.type === 'expense')
    .sort((a, b) => a.sort_order - b.sort_order)
  const incomeCategories = categories
    .filter((c) => c.type === 'income')
    .sort((a, b) => a.sort_order - b.sort_order)

  function handleSelect(id: string) {
    onSelect(id)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-slate-900"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              All Categories
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {expenseCategories.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Expenses
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {expenseCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelect(cat.id)}
                      className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
                        style={{ backgroundColor: cat.color + '22', color: cat.color }}
                      >
                        {cat.icon}
                      </span>
                      <span className="text-center text-[11px] font-medium leading-tight text-slate-700 dark:text-slate-300">
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {incomeCategories.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Income
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {incomeCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelect(cat.id)}
                      className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
                        style={{ backgroundColor: cat.color + '22', color: cat.color }}
                      >
                        {cat.icon}
                      </span>
                      <span className="text-center text-[11px] font-medium leading-tight text-slate-700 dark:text-slate-300">
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
