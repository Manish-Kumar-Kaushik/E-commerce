const toMoney = (value) => Math.round(Number(value || 0) * 100) / 100
const toNonNegativeMoney = (value) => Math.max(0, toMoney(value))

export const calculatePricingPreview = ({ basePrice = 0, gstRate = 0, discountAmount = 0 }) => {
  const safeBasePrice = toNonNegativeMoney(basePrice)
  const safeGstRate = Math.max(0, Number(gstRate || 0))
  const gstAmount = toMoney((safeBasePrice * safeGstRate) / 100)
  const finalPrice = toMoney(safeBasePrice + gstAmount)
  const safeDiscountAmount = Math.min(toNonNegativeMoney(discountAmount), finalPrice)
  const discountedPrice = toMoney(finalPrice - safeDiscountAmount)

  return {
    basePrice: safeBasePrice,
    gstRate: safeGstRate,
    gstAmount,
    finalPrice,
    discountAmount: safeDiscountAmount,
    discountedPrice,
    hasDiscount: safeDiscountAmount > 0,
  }
}

export const getProductPricing = (product = {}) => {
  const storedBasePrice = product.basePrice
  const storedGstRate = product.gstRate
  const storedGstAmount = product.gstAmount
  const storedDiscountAmount = product.discountAmount

  const hasStructuredPricing =
    storedBasePrice !== undefined
    || storedGstRate !== undefined
    || storedGstAmount !== undefined
    || storedDiscountAmount !== undefined

  if (hasStructuredPricing) {
    const preview = calculatePricingPreview({
      basePrice: storedBasePrice ?? product.price ?? 0,
      gstRate: storedGstRate ?? 0,
      discountAmount: storedDiscountAmount ?? 0,
    })

    return {
      ...preview,
      finalPrice: toMoney(product.price ?? preview.finalPrice),
      discountedPrice: toMoney(product.salePrice ?? preview.discountedPrice),
      hasDiscount: Number(product.salePrice ?? preview.discountedPrice) < Number(product.price ?? preview.finalPrice),
    }
  }

  const finalPrice = toMoney(product.price || 0)
  const discountedPrice = toMoney(product.salePrice ?? finalPrice)
  const discountAmount = toNonNegativeMoney(finalPrice - discountedPrice)

  return {
    basePrice: finalPrice,
    gstRate: 0,
    gstAmount: 0,
    finalPrice,
    discountAmount,
    discountedPrice,
    hasDiscount: discountAmount > 0,
  }
}

export const buildProductPricingFormValues = (product = {}) => {
  const pricing = getProductPricing(product)

  return {
    basePrice: pricing.basePrice > 0 ? pricing.basePrice.toString() : '',
    discountAmount: pricing.discountAmount > 0 ? pricing.discountAmount.toString() : '',
    gstRate: pricing.gstRate?.toString() || '0',
  }
}
