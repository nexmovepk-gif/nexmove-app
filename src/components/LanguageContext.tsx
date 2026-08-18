'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

export interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const translations: Translations = {
  // Navigation & General
  home: { en: 'Home', ar: 'الرئيسية' },
  marketplace: { en: 'Marketplace', ar: 'السوق العقاري' },
  agencies: { en: 'Agencies', ar: 'الوكالات' },
  architects: { en: 'Architects & Designers', ar: 'المهندسون المعماريون' },
  pricing: { en: 'Pricing', ar: 'الأسعار' },
  login: { en: 'Login', ar: 'تسجيل الدخول' },
  register: { en: 'Register', ar: 'إنشاء حساب' },
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
  adminPortal: { en: 'Admin Portal', ar: 'بوابة المشرف' },
  overseasPortal: { en: 'Overseas Portal', ar: 'بوابة المغتربين' },
  agencyDashboard: { en: 'Agency Dashboard', ar: 'لوحة تحكم الوكالة' },
  userDashboard: { en: 'User Dashboard', ar: 'لوحة المستخدم' },
  signOut: { en: 'Sign Out', ar: 'تسجيل الخروج' },

  // Overseas & KYC
  overseasHeroTitle: {
    en: 'Overseas Investment Command Centre',
    ar: 'مركز قيادة استثمارات المغتربين',
  },
  overseasHeroSubtitle: {
    en: 'Track your Pakistan property portfolio with multi-currency analytics, AI-powered legal protection & live agent access.',
    ar: 'تتبع محفظتك العقارية في باكستان بتحليلات متعددة العملات وحماية قانونية مدعومة بالذكاء الاصطناعي.',
  },
  aiKycVerifiedBadge: {
    en: 'Identity Auto-Verified via AI Gateway',
    ar: 'تم التحقق التلقائي من الهوية عبر بوابة الذكاء الاصطناعي',
  },
  forexSafeguardTitle: {
    en: 'SBP Interbank Forex Safeguard',
    ar: 'ضمان وحماية أسعار صرف بنك الدولة',
  },
  forexLocked: {
    en: 'Exchange Rate Locked for Escrow Protection',
    ar: 'تم تجميد وتثبيت سعر الصرف لحماية الضمان المالي',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  dir: 'ltr',
  isRtl: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('nexmove_language') as Language;
    if (saved === 'en' || saved === 'ar') {
      setLanguageState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nexmove_language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return fallback || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const isRtl = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
