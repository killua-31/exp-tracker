'use client'

import { useParams, useRouter } from 'next/navigation'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { useTransaction } from '@/hooks/useTransactions'

export default function EditTransactionPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: transaction, isLoading, error } = useTransaction(params.id as string)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="py-20 text-center text-slate-500">
        Transaction not found
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto pb-24">
      <h1 className="text-2xl font-semibold mb-6">Edit Transaction</h1>
      <TransactionForm
        initialData={transaction}
        onSuccess={() => router.push('/transactions')}
      />
    </div>
  )
}
