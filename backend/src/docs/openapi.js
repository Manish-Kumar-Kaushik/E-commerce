const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Shopzy Backend API',
    version: '1.0.0',
    description: 'Core API docs for order, payment, and vendor flows.',
  },
  servers: [
    {
      url: '/api',
      description: 'Local API base',
    },
  ],
  tags: [
    { name: 'Orders' },
    { name: 'Payments' },
    { name: 'Vendors' },
    { name: 'AI Services' },
  ],
  paths: {
    '/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create order',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrderRequest' },
            },
          },
        },
        responses: {
          201: { description: 'Order created' },
          400: { description: 'Validation error' },
        },
      },
      get: {
        tags: ['Orders'],
        summary: 'Get current user orders',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Orders list' },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order by id',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/OrderIdParam' }],
        responses: {
          200: { description: 'Order details' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/orders/{id}/invoice': {
      get: {
        tags: ['Orders'],
        summary: 'Download invoice PDF',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/OrderIdParam' }],
        responses: {
          200: { description: 'PDF invoice download' },
        },
      },
    },
    '/orders/{id}/cancel': {
      patch: {
        tags: ['Orders'],
        summary: 'Cancel order',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/OrderIdParam' }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Order cancelled' },
          400: { description: 'Invalid transition' },
        },
      },
    },
    '/orders/{id}/return-request': {
      patch: {
        tags: ['Orders'],
        summary: 'Request return for order item(s)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/OrderIdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reason', 'issueType'],
                properties: {
                  itemId: { type: 'string' },
                  reason: { type: 'string' },
                  issueType: {
                    type: 'string',
                    enum: ['wrong_item', 'defective', 'not_received', 'size_issue', 'other'],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Return requested' },
          400: { description: 'Invalid state or payload' },
        },
      },
    },
    '/orders/{id}/refund': {
      post: {
        tags: ['Orders'],
        summary: 'Process Stripe refund',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/OrderIdParam' }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  itemId: { type: 'string' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Refund processed' },
        },
      },
    },
    '/orders/track': {
      get: {
        tags: ['Orders'],
        summary: 'Public order tracking lookup',
        parameters: [
          {
            name: 'trackingId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Tracking details' },
        },
      },
    },
    '/payments/stripe/create-payment-intent': {
      post: {
        tags: ['Payments'],
        summary: 'Create Stripe Checkout session',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderId'],
                properties: {
                  orderId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Checkout session created' },
          409: { description: 'Reservation expired' },
        },
      },
    },
    '/payments/stripe/verify-payment': {
      post: {
        tags: ['Payments'],
        summary: 'Read-only verification endpoint (webhook remains source of truth)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['paymentIntentId'],
                properties: {
                  paymentIntentId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Payment verification state' },
        },
      },
    },
    '/payments/stripe/webhook': {
      post: {
        tags: ['Payments'],
        summary: 'Stripe webhook endpoint',
        description: 'Requires Stripe signature header and raw body.',
        responses: {
          200: { description: 'Webhook received' },
          400: { description: 'Invalid signature or payload' },
        },
      },
    },
    '/vendors/orders': {
      get: {
        tags: ['Vendors'],
        summary: 'Vendor dashboard orders (sub-order scoped)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Vendor order list with sub-order details' },
        },
      },
    },
    '/vendors/orders/{id}/status': {
      patch: {
        tags: ['Vendors'],
        summary: 'Update vendor-specific order/sub-order status',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/OrderIdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string' },
                  deliveryPartner: { type: 'string' },
                  estimatedDeliveryDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Vendor order status updated' },
        },
      },
    },
    '/vendors/orders/{id}/return/{itemId}/approve': {
      patch: {
        tags: ['Vendors'],
        summary: 'Approve return request for an item',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/OrderIdParam' },
          {
            name: 'itemId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Return approved' },
        },
      },
    },
    '/vendors/orders/{id}/return/{itemId}/reject': {
      patch: {
        tags: ['Vendors'],
        summary: 'Reject return request for an item',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/OrderIdParam' },
          {
            name: 'itemId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Return rejected' },
        },
      },
    },
    '/vendors/wallet': {
      get: {
        tags: ['Vendors'],
        summary: 'Get vendor wallet and transactions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Wallet details' },
        },
      },
    },
    '/ai/generate-product-content': {
      post: {
        tags: ['AI Services'],
        summary: 'Generate optimized product content',
        description: 'Uses Gemini AI to generate SEO titles, descriptions, and tags based on minimal input.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Summer Floral Dress' },
                  category: { type: 'string', example: 'fashion' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'AI Generated Content',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AIGeneratedContent' },
              },
            },
          },
        },
      },
    },
    '/products/{identifier}/reviews': {
      get: {
        tags: ['Orders'],
        summary: 'List product reviews',
        parameters: [
          {
            name: 'identifier',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Reviews list' },
        },
      },
      post: {
        tags: ['Orders'],
        summary: 'Create product review',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Review created' },
        },
      },
    },
    '/products/reviews/{id}': {
      patch: {
        tags: ['Orders'],
        summary: 'Update a review',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Review updated' },
        },
      },
      delete: {
        tags: ['Orders'],
        summary: 'Delete a review',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Review deleted' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    parameters: {
      OrderIdParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string' },
      },
    },
    schemas: {
      CreateOrderRequest: {
        type: 'object',
        required: ['shippingAddress'],
        properties: {
          shippingAddress: {
            type: 'object',
            required: ['fullName', 'phone', 'line1', 'city', 'state', 'postalCode', 'country'],
            properties: {
              fullName: { type: 'string' },
              phone: { type: 'string' },
              line1: { type: 'string' },
              line2: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              postalCode: { type: 'string' },
              country: { type: 'string' },
            },
          },
          paymentMethod: { type: 'string', enum: ['cod', 'stripe'] },
          couponCode: { type: 'string' },
        },
      },
      AIGeneratedContent: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
          category: { type: 'string' },
        },
      },
    },
  },
};

export default openApiSpec;
