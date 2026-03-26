'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction, getCategories } from '@/lib/api'

export function useTransactions(params: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => getTransactions({ ...params }),
  })
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: getCategories })
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: () => getTransaction(id),
    enabled: !!id,
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import('@/types').Transaction> }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
      qc.invalidateQueries({ queryKey: ['credit-cards'] })
      qc.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
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
