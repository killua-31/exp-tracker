export type AccountType = 'checking' | 'savings' | 'cash' | 'custom'
export type TransactionType = 'expense' | 'income' | 'transfer' | 'card_payment'
export type SourceType = 'account' | 'credit_card'
export type CategoryType = 'expense' | 'income'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  icon: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreditCard {
  id: string
  name: string
  issuer: string | null
  network: string | null
  credit_limit: number
  outstanding_balance: number
  currency: string
  statement_day: number | null
  due_day: number | null
  icon: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string
  color: string
  is_default: boolean
  sort_order: number
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: string
  category_id: string | null
  source_type: SourceType
  source_id: string
  destination_type: SourceType | null
  destination_id: string | null
  merchant: string | null
  note: string | null
  tags: string[]
  date: string
  is_recurring: boolean
  recurring_rule: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  category_id: string | null
  amount: number
  month: number
  year: number
  created_at: string
}

export interface BudgetStatus {
  budget: Budget
  spent: number
  remaining: number
  percentage: number
}

export interface DashboardSummary {
  total_cash: number
  total_credit_used: number
  total_credit_limit: number
  net_worth: number
  monthly_income: number
  monthly_expenses: number
  monthly_net: number
}

export interface SpendingByCategory {
  category_name: string
  category_icon: string
  category_color: string
  amount: number
  percentage: number
}

export interface TrendData {
  month: number
  year: number
  label: string
  income: number
  expenses: number
  net: number
}

export interface UserPreference {
  id: string
  key: string
  value: string
}
