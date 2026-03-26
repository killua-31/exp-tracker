'use client'

import { cn } from '@/lib/utils'
import type { Category, CategoryType } from '@/types'

interface CategoryChipsProps {
  selectedId: string | null
  onSelect: (id: string) => void
  type: CategoryType
  categories: Category[]
  onMoreClick: () => void
}

export function CategoryChips({ selectedId, onSelect, type, categories, onMoreClick }: CategoryChipsProps) {
  const filtered = categories
    .filter((c) => c.type === type)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 8)

  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
      {filtered.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
            selectedId === cat.id
              ? 'border-accent-500 bg-accent-50 text-accent-700 ring-2 ring-accent-500 dark:bg-accent-950 dark:text-accent-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          )}
        >
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
          <span className="whitespace-nowrap">{cat.name}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onMoreClick}
        className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
      >
        More
      </button>
    </div>
  )
}
