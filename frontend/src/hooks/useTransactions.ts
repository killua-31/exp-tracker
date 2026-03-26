'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTransactions, createTransaction, deleteTransaction, getCategories } from '@/lib/api'

export function useTransactions(params: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => getTransactions({ ...params }),
  })
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: getCategories })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
      qc.invalidateQueries({ queryKey: ['credit-cards'] })
      qc.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
      qc.invalidateQueries({ queryKey: ['credit-cards'] })
      qc.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}
