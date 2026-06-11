export const normalizeCouponCode = (couponCode = '') => couponCode.trim().toUpperCase();

export const getTieredDiscountRate = (couponCode, quantity) => {
  if (normalizeCouponCode(couponCode) !== 'RIBELLEDEAL') {
    return 0;
  }

  if (quantity >= 3) {
    return 0.2;
  }

  if (quantity === 2) {
    return 0.15;
  }

  if (quantity === 1) {
    return 0.1;
  }

  return 0;
};

export const calculateCouponDiscount = (items = [], couponCode = '') => {
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountRate = getTieredDiscountRate(couponCode, quantity);
  const discountAmount = Math.round(subtotal * discountRate);

  return {
    quantity,
    subtotal,
    discountRate,
    discountAmount,
    couponCode: discountRate ? normalizeCouponCode(couponCode) : '',
  };
};
