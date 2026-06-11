export const normalizeCouponCode = (couponCode = '') => couponCode.trim().toUpperCase()

export const getTieredDiscountRate = (couponCode, totalQuantity) => {
  if (normalizeCouponCode(couponCode) !== 'RIBELLEDEAL') {
    return 0
  }

  if (totalQuantity >= 3) {
    return 0.2
  }

  if (totalQuantity === 2) {
    return 0.15
  }

  if (totalQuantity === 1) {
    return 0.1
  }

  return 0
}

export const calculateCouponDiscount = (items = [], couponCode = '') => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountRate = getTieredDiscountRate(couponCode, totalQuantity)

  return {
    couponCode: discountRate ? normalizeCouponCode(couponCode) : '',
    discountAmount: Math.round(subtotal * discountRate),
    discountRate,
    subtotal,
    totalQuantity,
  }
}
