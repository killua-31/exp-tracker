'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAccount, updateAccount } from '@/lib/api'
import { useUIStore } from '@/stores/ui-store'
import type { Account, AccountType } from '@/types'

const PRESET_COLORS = [
  '#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b',
  '#ef4444', '#10b981', '#ec4899', '#6366f1',
]

interface AccountFormModalProps {
  isOpen: boolean
  onClose: () => void
  account?: Account
}

export function AccountFormModal({ isOpen, onClose, account }: AccountFormModalProps) {
  const addToast = useUIStore((s) => s.addToast)
  const qc = useQueryClient()
  const isEdit = !!account

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('checking')
  const [balance, setBalance] = useState('')
  const [currency, setCurrency] = useState('CAD')
  const [color, setColor] = useState(PRESET_COLORS[0])

  useEffect(() => {
    if (account) {
      setName(account.name)
      setType(account.type)
      setBalance(account.balance.toString())
      setCurrency(account.currency)
      setColor(account.color)
    } else {
      setName('')
      setType('checking')
      setBalance('')
      setCurrency('CAD')
      setColor(PRESET_COLORS[0])
    }
  }, [account, isOpen])

  const mutation = useMutation({
    mutationFn: (data: Partial<Account>) =>
      isEdit ? updateAccount(account!.id, data) : createAccount(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      addToast(isEdit ? 'Account updated' : 'Account created', 'success')
      onClose()
    },
    onError: () => {
      addToast('Failed to save account', 'error')
    },
  })

  function handleSave() {
    if (!name.trim()) {
      addToast('Please enter an account name', 'error')
      return
    }
    mutation.mutate({
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      currency,
      color,
      icon: 'wallet',
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-4 top-1/2 z-50 max-w-md mx-auto -translate-y-1/2 rounded-2xl bg-white p-6 shadow-elevated dark:bg-slate-900"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {isEdit ? 'Edit Account' : 'New Account'}
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Account name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="cash">Cash</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Balance
                </label>
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Currency
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-accent-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Color
                </label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full transition-transform ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSave}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
