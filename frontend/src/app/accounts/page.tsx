'use client'

import { useState } from 'react'
import { Landmark, Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/loading-skeleton'
import { AccountCard } from '@/components/accounts/account-card'
import { AccountFormModal } from '@/components/accounts/account-form-modal'
import { useAccounts } from '@/hooks/useAccounts'
import { formatCurrency } from '@/lib/utils'
import type { Account } from '@/types'

export default function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts()
  const [modalOpen, setModalOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<Account | undefined>()

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

  function handleEdit(account: Account) {
    setEditAccount(account)
    setModalOpen(true)
  }

  function handleAdd() {
    setEditAccount(undefined)
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditAccount(undefined)
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto pb-24">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        <Card className="mb-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-9 w-40" />
        </Card>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-5 w-28" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Accounts</h1>
        <Button variant="primary" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Total Balance */}
      <Card className="mb-6 bg-gradient-to-br from-accent-500 to-accent-700 text-white">
        <p className="text-sm font-medium text-accent-100">Total Balance</p>
        <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
      </Card>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No accounts yet"
          description="Add your bank accounts, savings, or cash to start tracking."
          actionLabel="Add Account"
          onAction={handleAdd}
        />
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onClick={() => handleEdit(account)}
            />
          ))}
        </div>
      )}

      <AccountFormModal
        isOpen={modalOpen}
        onClose={handleClose}
        account={editAccount}
      />
    </div>
  )
}
