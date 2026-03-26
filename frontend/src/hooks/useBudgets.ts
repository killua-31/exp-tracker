'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBudgets, createBudget, deleteBudget, getBudgetStatus } from '@/lib/api'

export function useBudgets(month: number, year: number) {
  return useQuery({ queryKey: ['budgets', month, year], queryFn: () => getBudgets(month, year) })
}
export function useBudgetStatus(month: number, year: number) {
  return useQuery({ queryKey: ['budgets', 'status', month, year], queryFn: () => getBudgetStatus(month, year) })
}
export function useCreateBudget() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createBudget, onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }) })
}
export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteBudget, onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }) })
}
