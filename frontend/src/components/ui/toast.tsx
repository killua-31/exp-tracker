'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
} as const

const VARIANT_CLASSES = {
  success: 'bg-income-50 text-income-700 dark:bg-income-900/80 dark:text-income-300',
  error: 'bg-expense-50 text-expense-700 dark:bg-expense-900/80 dark:text-expense-300',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/80 dark:text-blue-300',
} as const

const ICON_CLASSES = {
  success: 'text-income-500',
  error: 'text-expense-500',
  info: 'text-blue-500',
} as const

function ToastItem({ id, message, type }: { id: string; message: string; type: 'success' | 'error' | 'info' }) {
  const removeToast = useUIStore((s) => s.removeToast)
  const Icon = ICONS[type]

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), 3000)
    return () => clearTimeout(timer)
  }, [id, removeToast])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -100, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-lg backdrop-blur-sm',
        'pointer-events-auto min-w-[260px] max-w-sm',
        VARIANT_CLASSES[type]
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', ICON_CLASSES[type])} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="shrink-0 rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

export function Toast() {
  const toasts = useUIStore((s) => s.toasts)

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 p-4">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} id={toast.id} message={toast.message} type={toast.type} />
        ))}
      </AnimatePresence>
    </div>
  )
}
