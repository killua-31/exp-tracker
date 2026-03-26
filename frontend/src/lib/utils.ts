import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency = 'CAD') {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateShort(date: string) {
  return new Date(date).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  })
}

export function getRelativeDate(date: string) {
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d >= today) return 'Today'
  if (d >= yesterday) return 'Yesterday'
  return formatDateShort(date)
}
