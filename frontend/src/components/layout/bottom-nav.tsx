'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, PieChart, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/budgets', icon: PieChart, label: 'Budgets' },
  { href: '/more', icon: Menu, label: 'More' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:hidden">
      <div className="flex w-full items-center justify-around">
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'text-accent-600 dark:text-accent-400'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Spacer for FAB */}
        <div className="w-14" />

        {NAV_ITEMS.slice(2).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'text-accent-600 dark:text-accent-400'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
