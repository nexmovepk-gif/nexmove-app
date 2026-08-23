'use client'
// src/components/CurrencyContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { CurrencyCode, CURRENCIES, formatCurrencyPrice, updateLiveRates } from '@/lib/currency'

interface CurrencyContextType {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  formatPrice: (amountInPKR: number) => string
  liveRates: Record<CurrencyCode, number>
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'PKR',
  setCurrency: () => {},
  formatPrice: (amountInPKR: number) => formatCurrencyPrice(amountInPKR, 'PKR'),
  liveRates: {
    PKR: 1,
    USD: CURRENCIES.USD.rateInPKR,
    AED: CURRENCIES.AED.rateInPKR,
    GBP: CURRENCIES.GBP.rateInPKR,
    EUR: CURRENCIES.EUR.rateInPKR,
  },
})

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('PKR')
  const [liveRates, setLiveRates] = useState<Record<CurrencyCode, number>>({
    PKR: 1,
    USD: CURRENCIES.USD.rateInPKR,
    AED: CURRENCIES.AED.rateInPKR,
    GBP: CURRENCIES.GBP.rateInPKR,
    EUR: CURRENCIES.EUR.rateInPKR,
  })

  useEffect(() => {
    const saved = localStorage.getItem('nexmove_currency') as CurrencyCode
    if (saved && CURRENCIES[saved]) {
      setCurrencyState(saved)
    }

    // Fetch live rates from our cached API route
    fetch('/api/forex/rates')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.rates) {
          const newRates: Record<CurrencyCode, number> = {
            PKR: 1,
            USD: data.rates.USD?.rateInPKR || CURRENCIES.USD.rateInPKR,
            AED: data.rates.AED?.rateInPKR || CURRENCIES.AED.rateInPKR,
            GBP: data.rates.GBP?.rateInPKR || CURRENCIES.GBP.rateInPKR,
            EUR: data.rates.EUR?.rateInPKR || CURRENCIES.EUR.rateInPKR,
          }
          setLiveRates(newRates)
          updateLiveRates(newRates)
        }
      })
      .catch(() => {
        // graceful fallback to default CURRENCIES rates
      })
  }, [])

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code)
    localStorage.setItem('nexmove_currency', code)
  }

  const formatPrice = (amountInPKR: number) => {
    return formatCurrencyPrice(amountInPKR, currency)
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, liveRates }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
