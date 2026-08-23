// src/lib/currency.ts

export type CurrencyCode = 'PKR' | 'USD' | 'AED' | 'GBP' | 'EUR'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  name: string
  flag: string
  rateInPKR: number // 1 unit of currency = X PKR
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  PKR: { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', flag: '🇵🇰', rateInPKR: 1 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rateInPKR: 276.3 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', rateInPKR: 75.2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rateInPKR: 376.9 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rateInPKR: 322.8 },
}

/**
 * Dynamically updates CURRENCIES rates in memory from live API
 */
export function updateLiveRates(rates: Partial<Record<CurrencyCode, number>>) {
  if (rates.USD && rates.USD > 0) CURRENCIES.USD.rateInPKR = rates.USD
  if (rates.AED && rates.AED > 0) CURRENCIES.AED.rateInPKR = rates.AED
  if (rates.GBP && rates.GBP > 0) CURRENCIES.GBP.rateInPKR = rates.GBP
  if (rates.EUR && rates.EUR > 0) CURRENCIES.EUR.rateInPKR = rates.EUR
}

/**
 * Converts a base price in PKR to the target currency and formats it cleanly.
 */
export function formatCurrencyPrice(amountInPKR: number, targetCode: CurrencyCode = 'PKR'): string {
  const currency = CURRENCIES[targetCode] || CURRENCIES.PKR
  const converted = amountInPKR / currency.rateInPKR

  if (targetCode === 'PKR') {
    if (converted >= 10000000) return `Rs ${(converted / 10000000).toFixed(2)} Cr`
    if (converted >= 100000) return `Rs ${(converted / 100000).toFixed(2)} Lac`
    return `Rs ${converted.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
  }

  if (converted >= 1000000) {
    return `${currency.symbol} ${(converted / 1000000).toFixed(2)}M`
  }
  if (converted >= 1000) {
    return `${currency.symbol} ${(converted / 1000).toFixed(1)}k`
  }
  return `${currency.symbol} ${converted.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}
