'use client'
import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, getSpendingByCategory, getTrends } from '@/lib/api'

export function useDashboardSummary() {
  return useQuery({ queryKey: ['dashboard', 'summary'], queryFn: getDashboardSummary })
}

export function useSpendingByCategory(month: number, year: number) {
  return useQuery({
    queryKey: ['dashboard', 'spending', month, year],
    queryFn: () => getSpendingByCategory(month, year),
  })
}

export function useTrends(months = 6) {
  return useQuery({
    queryKey: ['dashboard', 'trends', months],
    queryFn: () => getTrends(months),
  })
}
