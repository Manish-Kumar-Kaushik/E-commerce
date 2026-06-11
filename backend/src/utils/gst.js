const ALLOWED_GST_RATES = new Set([0, 5, 12, 18, 28]);
const ELECTRONIC_GST_RATES = new Set([12, 18]);

const normalizeCategory = (value = '') => value.toString().trim().toLowerCase();

const isClothingCategory = (category = '') => {
  const normalized = normalizeCategory(category);
  return ['clothing', 'fashion', 'apparel', 'men', 'women', 'kids'].includes(normalized);
};

const isElectronicsCategory = (category = '') => {
  const normalized = normalizeCategory(category);
  return ['electronics', 'electronic', 'mobile', 'laptop', 'appliance', 'gadgets'].includes(normalized);
};

const toMoney = (value) => Math.round(Number(value || 0) * 100) / 100;
const toNonNegativeMoney = (value) => Math.max(0, toMoney(value));

export const resolveGstRateForCategory = (category, requestedRate) => {
  const numericRate = Number(requestedRate);
  if (ALLOWED_GST_RATES.has(numericRate)) {
    return numericRate;
  }

  if (isClothingCategory(category)) {
    return 5;
  }

  if (isElectronicsCategory(category)) {
    if (ELECTRONIC_GST_RATES.has(numericRate)) {
      return numericRate;
    }
    return 18;
  }

  return 0;
};

export const applyGstToPrice = (basePrice, gstRate) => {
  const safeBase = toNonNegativeMoney(basePrice);
  const safeRate = Math.max(0, Number(gstRate || 0));
  const gstAmount = toMoney((safeBase * safeRate) / 100);
  const finalPrice = toMoney(safeBase + gstAmount);

  return {
    basePrice: toMoney(safeBase),
    gstRate: safeRate,
    gstAmount,
    finalPrice,
  };
};

export const buildProductPricingWithGst = ({ category, basePrice, discountAmount = 0, gstRate: requestedRate }) => {
  const resolvedGstRate = resolveGstRateForCategory(category, requestedRate);
  const priceResult = applyGstToPrice(basePrice, resolvedGstRate);
  const safeDiscountAmount = toNonNegativeMoney(discountAmount);

  if (safeDiscountAmount > priceResult.finalPrice) {
    throw new Error('Discount must be less than or equal to final selling price');
  }

  const discountedPrice = toMoney(priceResult.finalPrice - safeDiscountAmount);

  return {
    gstRate: resolvedGstRate,
    isPriceInclusiveOfGst: true,
    basePrice: priceResult.basePrice,
    gstAmount: priceResult.gstAmount,
    discountAmount: safeDiscountAmount,
    price: priceResult.finalPrice,
    salePrice: safeDiscountAmount > 0 ? discountedPrice : null,
  };
};
