'use client'

import { Card } from '@/components/ui/card'
import { ThemeToggle } from '@/components/settings/theme-toggle'
import { CategoryManager } from '@/components/settings/category-manager'
import { ExportButton } from '@/components/settings/export-button'

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>

      {/* Appearance */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Appearance
        </h2>
        <ThemeToggle />
      </Card>

      {/* Categories */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Categories
        </h2>
        <CategoryManager />
      </Card>

      {/* Data */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Data
        </h2>
        <ExportButton />
      </Card>

      {/* About */}
      <Card>
        <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
          About
        </h2>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">FinTrack v1.0</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Personal finance tracker
        </p>
      </Card>
    </div>
  )
}
