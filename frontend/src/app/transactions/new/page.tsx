'use client'

import { TransactionForm } from '@/components/transactions/transaction-form'
import { useRouter } from 'next/navigation'

export default function NewTransactionPage() {
  const router = useRouter()
  return (
    <div className="max-w-lg mx-auto pb-24">
      <h1 className="text-2xl font-semibold mb-6">New Transaction</h1>
      <TransactionForm onSuccess={() => router.push('/transactions')} />
    </div>
  )
}
