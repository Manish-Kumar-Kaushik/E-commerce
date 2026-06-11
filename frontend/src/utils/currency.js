export const countryCurrencyMap = {
  IN: {
    code: 'INR',
    label: 'India',
    locale: 'en-IN',
    rate: 1,
    symbol: 'Rs.',
  },
  US: {
    code: 'USD',
    label: 'United States',
    locale: 'en-US',
    rate: 0.012,
    symbol: '$',
  },
  AE: {
    code: 'AED',
    label: 'UAE',
    locale: 'en-AE',
    rate: 0.044,
    symbol: 'AED',
  },
  GB: {
    code: 'GBP',
    label: 'United Kingdom',
    locale: 'en-GB',
    rate: 0.0094,
    symbol: 'GBP',
  },
}

export const formatCurrency = (value, country = 'IN') => {
  const config = countryCurrencyMap[country] || countryCurrencyMap.IN
  const converted = value * config.rate

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    maximumFractionDigits: 0,
  }).format(converted)
}
