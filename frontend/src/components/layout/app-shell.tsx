'use client'

import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { FAB } from './fab'
import { QuickAddSheet } from '@/components/transactions/quick-add-sheet'
import { Toast } from '@/components/ui/toast'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <Sidebar />
      <main className="min-h-screen pb-20 pl-0 lg:pb-0 lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
      <BottomNav />
      <FAB />
      <QuickAddSheet />
      <Toast />
    </>
  )
}
