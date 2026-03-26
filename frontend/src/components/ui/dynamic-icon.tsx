'use client'

import {
  Home, ShoppingCart, Utensils, Bus, Fuel, Zap, Wifi, Smartphone,
  Shield, HeartPulse, ShoppingBag, Repeat, Film, GraduationCap,
  Plane, ArrowLeftRight, CreditCard, Briefcase, Laptop, TrendingUp,
  PlusCircle, Wallet, Landmark, PiggyBank, Banknote, CircleDollarSign,
  type LucideIcon
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  'home': Home,
  'shopping-cart': ShoppingCart,
  'utensils': Utensils,
  'bus': Bus,
  'fuel': Fuel,
  'zap': Zap,
  'wifi': Wifi,
  'smartphone': Smartphone,
  'shield': Shield,
  'heart-pulse': HeartPulse,
  'shopping-bag': ShoppingBag,
  'repeat': Repeat,
  'film': Film,
  'graduation-cap': GraduationCap,
  'plane': Plane,
  'arrow-left-right': ArrowLeftRight,
  'credit-card': CreditCard,
  'briefcase': Briefcase,
  'laptop': Laptop,
  'trending-up': TrendingUp,
  'plus-circle': PlusCircle,
  'wallet': Wallet,
  'landmark': Landmark,
  'piggy-bank': PiggyBank,
  'banknote': Banknote,
  'circle-dollar-sign': CircleDollarSign,
}

interface DynamicIconProps {
  name: string
  size?: number
  className?: string
}

export function DynamicIcon({ name, size = 20, className }: DynamicIconProps) {
  const IconComponent = iconMap[name] || Wallet
  return <IconComponent size={size} className={className} />
}
