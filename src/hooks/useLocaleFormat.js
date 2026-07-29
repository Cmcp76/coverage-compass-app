// Locale-aware formatting for dates, numbers, and currency, driven by the
// active language's Intl locale (see src/i18n/languages.js). Uses the
// browser's built-in Intl API — no extra dependency, full Unicode support.

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getLanguage } from '../i18n/languages'

export function useLocaleFormat() {
  const { i18n } = useTranslation()
  const { intlLocale, currency } = getLanguage(i18n.language)

  return useMemo(() => {
    const dateFormatter = new Intl.DateTimeFormat(intlLocale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const shortDateFormatter = new Intl.DateTimeFormat(intlLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

    const numberFormatter = new Intl.NumberFormat(intlLocale)

    const currencyFormatter = new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency,
    })

    return {
      /** e.g. "July 29, 2026" / "29 de julio de 2026" */
      formatDate: (date) => dateFormatter.format(date instanceof Date ? date : new Date(date)),
      /** e.g. "Jul 29, 2026" */
      formatShortDate: (date) =>
        shortDateFormatter.format(date instanceof Date ? date : new Date(date)),
      /** e.g. "1,234.5" — Unicode digit grouping/decimal per locale */
      formatNumber: (value) => numberFormatter.format(value),
      /** e.g. "$1,234.50" — currency symbol and grouping per locale */
      formatCurrency: (value) => currencyFormatter.format(value),
      intlLocale,
      currency,
    }
  }, [intlLocale, currency])
}
