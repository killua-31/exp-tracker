'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'

export function FAB() {
  const openQuickAdd = useUIStore((s) => s.openQuickAdd)

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      onClick={openQuickAdd}
      className="fixed bottom-20 left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg hover:bg-accent-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 lg:bottom-8 lg:left-auto lg:right-8 lg:translate-x-0"
      aria-label="Quick add transaction"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </motion.button>
  )
}
