import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { getProductBySlug } from './productService.js';
import { getUserOrders } from './orderService.js';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set in .env file. AI features will use fallback responses.');
}
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const PRODUCT_INSIGHT_FIELDS = {
  electronics: [
    ['brand', 'Brand'],
    ['modelName', 'Model Name'],
    ['screenSize', 'Screen Size'],
    ['colour', 'Colour'],
    ['ramMemoryInstalledSize', 'RAM Memory Installed Size'],
    ['operatingSystem', 'Operating System'],
    ['graphicsCardDescription', 'Graphics Card Description'],
    ['cpuSpeed', 'CPU Speed'],
    ['hardDiskDescription', 'Hard Disk Description'],
    ['itemWeight', 'Item Weight'],
  ],
  laptops: [
    ['brand', 'Brand'],
    ['modelName', 'Model Name'],
    ['screenSize', 'Screen Size'],
    ['colour', 'Colour'],
    ['ramMemoryInstalledSize', 'RAM Memory Installed Size'],
    ['operatingSystem', 'Operating System'],
    ['graphicsCardDescription', 'Graphics Card Description'],
    ['cpuSpeed', 'CPU Speed'],
    ['hardDiskDescription', 'Hard Disk Description'],
    ['itemWeight', 'Item Weight'],
  ],
  mobile: [
    ['brand', 'Brand'],
    ['modelName', 'Model Name'],
    ['screenSize', 'Screen Size'],
    ['colour', 'Colour'],
    ['ramMemoryInstalledSize', 'RAM Memory Installed Size'],
    ['operatingSystem', 'Operating System'],
    ['graphicsCardDescription', 'Chip / Processor'],
    ['cpuSpeed', 'CPU Speed'],
    ['hardDiskDescription', 'Storage'],
    ['itemWeight', 'Item Weight'],
  ],
  tv: [
    ['brand', 'Brand'],
    ['modelName', 'Model Name'],
    ['screenSize', 'Screen Size'],
    ['colour', 'Colour'],
    ['operatingSystem', 'Operating System'],
    ['graphicsCardDescription', 'Panel / Processor'],
    ['cpuSpeed', 'CPU Speed'],
    ['hardDiskDescription', 'Storage / Memory'],
    ['itemWeight', 'Item Weight'],
  ],
};

const normalizeCategory = (value = '') => String(value || '').trim().toLowerCase();

const getInsightFields = (category) => PRODUCT_INSIGHT_FIELDS[normalizeCategory(category)] || [];

const buildFallbackInsights = ({ name, category }) => {
  const normalizedCategory = normalizeCategory(category);
  const baseName = String(name || '').trim();
  const baseBrand = baseName.split(' ')[0] || 'Generic';
  const fields = getInsightFields(normalizedCategory);

  const values = Object.fromEntries(fields.map(([key, label]) => [key, '']));
  values.brand = baseBrand;
  values.modelName = baseName || `${baseBrand} ${normalizedCategory || 'Product'}`.trim();
  if (normalizedCategory === 'tv') {
    values.screenSize = '43 inch';
    values.operatingSystem = 'Smart TV OS';
    values.hardDiskDescription = '32 GB storage';
  } else if (normalizedCategory === 'mobile') {
    values.screenSize = '6.5 inch';
    values.operatingSystem = 'Android';
    values.graphicsCardDescription = 'Octa-core processor';
    values.hardDiskDescription = '128 GB storage';
  } else if (normalizedCategory === 'laptops' || normalizedCategory === 'electronics') {
    values.screenSize = '15.6 inch';
    values.operatingSystem = 'Windows 11';
    values.graphicsCardDescription = 'Integrated Graphics';
    values.hardDiskDescription = '512 GB SSD';
    values.cpuSpeed = '2.4 GHz';
    values.ramMemoryInstalledSize = '8 GB';
  }

  return {
    title: `${baseName || baseBrand} — Premium Quality`,
    description: `High-quality ${baseName || baseBrand} in the ${category} category. Designed for performance, durability, and customer satisfaction.`,
    tags: [
      (baseName || 'product').toLowerCase().split(' ')[0],
      normalizedCategory || 'product',
      'quality',
      'recommended',
      'bestseller',
      'popular',
    ],
    category: category || 'general',
    insights: {
      suggestedBasePrice: '',
      variant: 'Standard',
      chip: values.graphicsCardDescription || '',
      size: values.screenSize || '',
      attributes: fields.map(([key, label]) => ({
        section: normalizedCategory === 'tv' ? 'Display' : 'Specifications',
        key,
        label,
        value: values[key] || '',
      })),
      ...values,
    },
  };
};

const normalizeText = (value = '') => String(value || '').trim().toLowerCase();

const compactString = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const summarizeProductForSupport = (product = null) => {
  if (!product) {
    return null;
  }

  return {
    id: product._id?.toString?.() || product._id || '',
    slug: product.slug || '',
    name: product.name || '',
    category: product.category || '',
    price: Number(product.salePrice ?? product.price ?? 0),
    salePrice: Number(product.salePrice ?? 0),
    stock: Number(product.stock ?? 0),
    rating: Number(product.averageRating ?? 0),
    reviewsCount: Number(product.reviewsCount ?? 0),
    description: compactString(product.description || '').slice(0, 420),
    tags: Array.isArray(product.tags) ? product.tags.slice(0, 8) : [],
    attributes: Array.isArray(product.attributes)
      ? product.attributes.slice(0, 10).map((attribute) => ({
          section: attribute.section || 'Specifications',
          label: attribute.label || attribute.key || '',
          value: attribute.value || '',
        }))
      : [],
    vendorName: product.vendor?.businessName || product.vendorName || '',
  };
};

const summarizeOrderForSupport = (order = null) => {
  if (!order) {
    return null;
  }

  const vendorSplits = Array.isArray(order.subOrders) && order.subOrders.length ? order.subOrders : (order.vendors || []);

  return {
    id: order._id?.toString?.() || order._id || '',
    orderNumber: order.orderNumber || '',
    status: order.orderStatus || order.status || '',
    paymentStatus: order.paymentStatus || '',
    paymentMethod: order.paymentMethod || '',
    totalAmount: Number(order.totalAmount ?? 0),
    createdAt: order.createdAt || '',
    updatedAt: order.updatedAt || '',
    trackingId: vendorSplits.find((split) => split?.trackingId)?.trackingId || order.trackingId || '',
    invoiceNumber: vendorSplits.find((split) => split?.invoiceNumber)?.invoiceNumber || order.invoiceNumber || '',
    items: (order.items || []).slice(0, 8).map((item) => ({
      name: item.name || item.product?.name || 'Item',
      productId: item.product?._id?.toString?.() || item.product || '',
      quantity: Number(item.quantity ?? 0),
      price: Number(item.price ?? 0),
      size: item.size || '',
      color: item.color || '',
      status: item.itemStatus || '',
    })),
  };
};

const selectRelevantOrder = (orders = [], message = '', orderId = '') => {
  const normalizedMessage = normalizeText(message);
  const normalizedOrderId = normalizeText(orderId);
  const orderList = Array.isArray(orders) ? orders : [];

  if (normalizedOrderId) {
    const directMatch = orderList.find((order) => {
      const exactId = normalizeText(order?._id?.toString?.() || order?._id || '');
      const orderNumber = normalizeText(order?.orderNumber || '');
      const shortId = normalizeText((order?._id?.toString?.() || order?._id || '').slice(-6));
      return exactId === normalizedOrderId || orderNumber === normalizedOrderId || shortId === normalizedOrderId;
    });

    if (directMatch) {
      return directMatch;
    }
  }

  const orderNumberMatch = normalizedMessage.match(/(?:order\s*(?:no|number)?\s*#?\s*)([a-z0-9-]+)/i);
  if (orderNumberMatch?.[1]) {
    const token = normalizeText(orderNumberMatch[1]);
    const matchedByNumber = orderList.find((order) => {
      const orderNumber = normalizeText(order?.orderNumber || '');
      const shortId = normalizeText((order?._id?.toString?.() || order?._id || '').slice(-6));
      return orderNumber === token || shortId === token;
    });

    if (matchedByNumber) {
      return matchedByNumber;
    }
  }

  if (/(order|delivery|tracking|refund|return|cancel|status|shipment)/.test(normalizedMessage)) {
    return orderList[0] || null;
  }

  return null;
};

const buildFallbackCustomerSupportReply = ({ message = '', user = null, product = null, order = null, orders = [] }) => {
  const normalizedMessage = normalizeText(message);
  const username = user?.name || 'there';

  if (order) {
    const orderSummary = summarizeOrderForSupport(order);
    const itemCount = orderSummary.items.reduce((count, item) => count + Number(item.quantity || 0), 0);
    const status = String(orderSummary.status || 'pending').replace(/_/g, ' ');
    const trackingText = orderSummary.trackingId ? ` Tracking ID: ${orderSummary.trackingId}.` : '';
    const invoiceText = orderSummary.invoiceNumber ? ` Invoice number: ${orderSummary.invoiceNumber}.` : '';

    if (/(cancel|cancelled|cancell)/.test(normalizedMessage)) {
      return `Hi ${username}, I found your order #${orderSummary.orderNumber || orderSummary.id}. It is currently ${status}. If it has not shipped yet, you can cancel it from My Orders. ${trackingText}${invoiceText}`.trim();
    }

    if (/(refund|return)/.test(normalizedMessage)) {
      return `Hi ${username}, your order #${orderSummary.orderNumber || orderSummary.id} is ${status}. Returns and refunds are handled after delivery. If you want, I can help you check eligibility or guide you through the return flow. ${trackingText}${invoiceText}`.trim();
    }

    return `Hi ${username}, your order #${orderSummary.orderNumber || orderSummary.id} is currently ${status}. It contains ${itemCount} item(s) and the payment status is ${String(orderSummary.paymentStatus || 'unknown').replace(/_/g, ' ')}.${trackingText}${invoiceText}`.trim();
  }

  if (product) {
    const productSummary = summarizeProductForSupport(product);
    const price = Number(productSummary.salePrice || productSummary.price || 0);
    const stockText = Number(productSummary.stock || 0) > 0 ? `${productSummary.stock} in stock` : 'currently out of stock';
    const ratingText = Number(productSummary.rating || 0) > 0
      ? ` It has a ${Number(productSummary.rating).toFixed(1)}/5 rating from ${Number(productSummary.reviewsCount || 0)} reviews.`
      : '';

    return `Hi ${username}, ${productSummary.name || 'this product'} is listed under ${productSummary.category || 'the selected category'}. Current price is ₹${price || 'N/A'} and it is ${stockText}.${ratingText} If you want, I can also explain the specs or compare it with another product.`.trim();
  }

  if (/(order|tracking|refund|return|cancel|delivery|status)/.test(normalizedMessage)) {
    if (!orders.length) {
      return 'I can help with your order status, tracking, cancellation, and returns. Please sign in and share your order number so I can check the latest details.';
    }

    const latestOrder = summarizeOrderForSupport(orders[0]);
    return `I found your latest order #${latestOrder.orderNumber || latestOrder.id}. Its current status is ${String(latestOrder.status || 'pending').replace(/_/g, ' ')}. Share the order number if you want me to check a specific order.`;
  }

  return 'Hi! I can help with order status, delivery, cancellation, returns, and product details. Share your order number or ask about the product you are viewing.';
};

const parseCustomerSupportResponse = (text) => {
  const jsonMatch = String(text || '').match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return null;
  }
};

export const generateCustomerSupportReply = async ({
  message = '',
  user = null,
  product = null,
  orders = [],
  orderId = '',
}) => {
  const selectedOrder = selectRelevantOrder(orders, message, orderId);

  if (!genAI) {
    return {
      reply: buildFallbackCustomerSupportReply({ message, user, product, order: selectedOrder, orders }),
      topic: selectedOrder ? 'order' : product ? 'product' : 'general',
      suggestedActions: selectedOrder
        ? ['Track this order', 'Cancel if not shipped', 'Ask about return eligibility']
        : product
          ? ['View product specs', 'Add to cart', 'Compare with another product']
          : ['Share order number', 'Open product page', 'Contact support'],
      needsHumanSupport: false,
      order: selectedOrder ? summarizeOrderForSupport(selectedOrder) : null,
      product: product ? summarizeProductForSupport(product) : null,
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
You are Shopzy's customer support assistant.
Respond in simple, friendly English. Keep the answer short and practical.

Rules:
- Use only the context provided below.
- If the user asks about an order and no matching order exists, ask them for the order number.
- If the user asks about a product, answer from the product context.
- If the information is not available, say what you can confirm and what you cannot.
- Do not mention internal field names, database terms, or JSON.

Return strictly valid JSON only with these keys:
{
  "reply": "string",
  "topic": "order|product|general",
  "suggestedActions": ["string"],
  "needsHumanSupport": true|false
}

User message: ${message}

Customer context:
${JSON.stringify(
  {
    customer: user ? { id: user._id, name: user.name, email: user.email, role: user.role } : null,
    order: selectedOrder ? summarizeOrderForSupport(selectedOrder) : null,
    product: product ? summarizeProductForSupport(product) : null,
    recentOrders: orders.slice(0, 5).map((item) => summarizeOrderForSupport(item)),
  },
  null,
  2,
)}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const parsed = parseCustomerSupportResponse(response.text());

    if (!parsed?.reply) {
      throw new Error('AI response format was invalid');
    }

    return {
      reply: compactString(parsed.reply),
      topic: parsed.topic || (selectedOrder ? 'order' : product ? 'product' : 'general'),
      suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions.slice(0, 4) : [],
      needsHumanSupport: Boolean(parsed.needsHumanSupport),
      order: selectedOrder ? summarizeOrderForSupport(selectedOrder) : null,
      product: product ? summarizeProductForSupport(product) : null,
    };
  } catch (error) {
    console.error('Gemini Customer Support Error:', error.message);
    return {
      reply: buildFallbackCustomerSupportReply({ message, user, product, order: selectedOrder, orders }),
      topic: selectedOrder ? 'order' : product ? 'product' : 'general',
      suggestedActions: selectedOrder
        ? ['Track this order', 'Cancel if not shipped', 'Ask about return eligibility']
        : product
          ? ['View product specs', 'Add to cart', 'Compare with another product']
          : ['Share order number', 'Open product page', 'Contact support'],
      needsHumanSupport: true,
      order: selectedOrder ? summarizeOrderForSupport(selectedOrder) : null,
      product: product ? summarizeProductForSupport(product) : null,
    };
  }
};

const fetchImageAsInlineData = async (imageUrl) => {
  if (!imageUrl) {
    return null;
  }

  const normalizedUrl = String(imageUrl).startsWith('http')
    ? imageUrl
    : new URL(String(imageUrl), `http://127.0.0.1:${process.env.PORT || 5001}`).toString();

  const response = await fetch(normalizedUrl);
  if (!response.ok) {
    return null;
  }

  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();

  return {
    mimeType,
    data: Buffer.from(arrayBuffer).toString('base64'),
  };
};

export const generateProductMetadata = async ({ name, category, images = [] }) => {
  try {
    // If no API key, use fallback immediately
    if (!genAI) {
      console.warn('No Gemini API key configured, using fallback responses');
      return buildFallbackInsights({ name, category });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const hasImage = Array.isArray(images) && images.length > 0;

    if (hasImage) {
      const inlineImage = await fetchImageAsInlineData(images[0]);

      if (inlineImage) {
        const prompt = `
You are a product catalog assistant for an ecommerce vendor dashboard.
Analyze the product image and the provided product context.
Return strictly valid JSON only with these keys:
- title
- description
- tags (array of 6 lowercase keywords)
- category
- insights: {
  suggestedBasePrice,
  variant,
  chip,
  size,
  brand,
  modelName,
  screenSize,
  colour,
  ramMemoryInstalledSize,
  operatingSystem,
  graphicsCardDescription,
  cpuSpeed,
  hardDiskDescription,
  itemWeight,
  attributes: [{ section, key, label, value }]
}

Product name: ${name}
Category: ${category}

If you are unsure about a value, leave it blank rather than inventing it.
Do not include markdown, code fences, or explanations.
        `;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: inlineImage,
          },
        ]);

        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          throw new Error('AI response format was invalid');
        }

        return JSON.parse(jsonMatch[0]);
      }
    }

    const prompt = `
    Act as an e-commerce SEO expert. 
    Based on the product name "${name}" and category "${category}", generate high-quality product details.
    Return a strictly valid JSON object with the following keys:
    - title: A professional, catchy product title (max 80 characters).
    - description: A persuasive, SEO-optimized product description including features and benefits (at least 2 paragraphs).
    - tags: An array of 6 relevant search keywords (lowercase).
    - category: The most appropriate category if "${category}" is too broad.

    Output JSON ONLY. Do not include markdown formatting or backticks.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON if AI includes markdown backticks accidentally
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI response format was invalid');
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      ...parsed,
      insights: buildFallbackInsights({ name, category }).insights,
    };
  } catch (error) {
    console.error('Gemini Generation Error:', error.message);
    // In development, return a safe deterministic fallback
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Returning development fallback product metadata');
      return buildFallbackInsights({ name, category });
    }

    throw new Error('AI was unable to generate content at this time. Please try again later.');
  }
};
