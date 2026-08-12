'use client'
// src/components/CurrencyContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { CurrencyCode, CURRENCIES, formatCurrencyPrice } from '@/lib/currency'

interface CurrencyContextType {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  formatPrice: (amountInPKR: number) => string
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'PKR',
  setCurrency: () => {},
  formatPrice: (amountInPKR: number) => formatCurrencyPrice(amountInPKR, 'PKR'),
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('PKR')

  useEffect(() => {
    const saved = localStorage.getItem('nexmove_currency') as CurrencyCode
    if (saved && CURRENCIES[saved]) {
      setCurrencyState(saved)
    }
  }, [])

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code)
    localStorage.setItem('nexmove_currency', code)
  }

  const formatPrice = (amountInPKR: number) => {
    return formatCurrencyPrice(amountInPKR, currency)
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
