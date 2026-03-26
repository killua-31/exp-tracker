import { Suspense } from 'react'
import { QuickAddStandalone } from '@/components/transactions/quick-add-standalone'

export default function QuickAddPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <QuickAddStandalone />
    </Suspense>
  )
}
