import type {
  Account,
  CreditCard,
  Category,
  Transaction,
  Budget,
  BudgetStatus,
  DashboardSummary,
  SpendingByCategory,
  TrendData,
  UserPreference,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || 'API error')
  }
  return res.json()
}

// Accounts
export async function getAccounts() {
  return api<Account[]>('/accounts')
}
export async function createAccount(data: Partial<Account>) {
  return api<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) })
}
export async function updateAccount(id: string, data: Partial<Account>) {
  return api<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function deleteAccount(id: string) {
  return api(`/accounts/${id}`, { method: 'DELETE' })
}

// Credit Cards
export async function getCreditCards() {
  return api<CreditCard[]>('/credit-cards')
}
export async function createCreditCard(data: Partial<CreditCard>) {
  return api<CreditCard>('/credit-cards', { method: 'POST', body: JSON.stringify(data) })
}
export async function updateCreditCard(id: string, data: Partial<CreditCard>) {
  return api<CreditCard>(`/credit-cards/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function deleteCreditCard(id: string) {
  return api(`/credit-cards/${id}`, { method: 'DELETE' })
}

// Categories
export async function getCategories() {
  return api<Category[]>('/categories')
}
export async function createCategory(data: Partial<Category>) {
  return api<Category>('/categories', { method: 'POST', body: JSON.stringify(data) })
}

// Transactions
export async function getTransactions(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return api<Transaction[]>(`/transactions${query}`)
}
export async function createTransaction(data: Partial<Transaction>) {
  return api<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) })
}
export async function createQuickTransaction(data: Partial<Transaction>) {
  return api<Transaction>('/transactions/quick', { method: 'POST', body: JSON.stringify(data) })
}
export async function updateTransaction(id: string, data: Partial<Transaction>) {
  return api<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}
export async function deleteTransaction(id: string) {
  return api(`/transactions/${id}`, { method: 'DELETE' })
}

// Dashboard
export async function getDashboardSummary() {
  return api<DashboardSummary>('/dashboard/summary')
}
export async function getSpendingByCategory(month: number, year: number) {
  return api<SpendingByCategory[]>(`/dashboard/spending-by-category?month=${month}&year=${year}`)
}
export async function getTrends(months = 6) {
  return api<TrendData[]>(`/dashboard/trends?months=${months}`)
}

// Budgets
export async function getBudgets(month?: number, year?: number) {
  const params = new URLSearchParams()
  if (month) params.set('month', String(month))
  if (year) params.set('year', String(year))
  return api<Budget[]>(`/budgets?${params}`)
}
export async function createBudget(data: Partial<Budget>) {
  return api<Budget>('/budgets', { method: 'POST', body: JSON.stringify(data) })
}
export async function deleteBudget(id: string) {
  return api(`/budgets/${id}`, { method: 'DELETE' })
}
export async function getBudgetStatus(month: number, year: number) {
  return api<BudgetStatus[]>(`/budgets/status?month=${month}&year=${year}`)
}

// Preferences
export async function getPreferences() {
  return api<UserPreference[]>('/preferences')
}
export async function updatePreferences(prefs: Array<{ key: string; value: string }>) {
  return api('/preferences', { method: 'PUT', body: JSON.stringify(prefs) })
}
