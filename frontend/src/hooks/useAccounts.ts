'use client'
import { useQuery } from '@tanstack/react-query'
import { getAccounts, getCreditCards, getBudgetStatus } from '@/lib/api'

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: getAccounts })
}

export function useCreditCards() {
  return useQuery({ queryKey: ['credit-cards'], queryFn: getCreditCards })
}

export function useBudgetStatus(month: number, year: number) {
  return useQuery({
    queryKey: ['budgets', 'status', month, year],
    queryFn: () => getBudgetStatus(month, year),
  })
}
