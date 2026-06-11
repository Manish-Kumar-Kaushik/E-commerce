import mongoose from 'mongoose';

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    line1: {
      type: String,
      required: true,
      trim: true,
    },
    line2: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    vendorName: {
      type: String,
      trim: true,
      default: '',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    slug: {
      type: String,
      trim: true,
      default: '',
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    itemStatus: {
      type: String,
      enum: [
        'created',
        'payment_pending',
        'paid',
        'confirmed',
        'packed',
        'shipped',
        'delivered',
        'cancelled',
        'return_requested',
        'returned',
        'refunded',
        'pending',
        'processing',
      ],
      default: 'created',
    },
    shippedAt: Date,
    deliveredAt: Date,
  },
  { _id: true },
);

const paymentDetailsSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['stripe', 'cod'],
    },
    paidAt: Date,
  },
  { _id: false },
);

const subOrderSchema = new mongoose.Schema(
  {
    subOrderNumber: {
      type: String,
      trim: true,
      default: '',
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    vendorName: {
      type: String,
      trim: true,
      default: '',
    },
    itemIds: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },
    itemCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    subtotalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commission: {
      type: Number,
      default: 0,
      min: 0,
    },
    vendorEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        'created',
        'payment_pending',
        'paid',
        'confirmed',
        'packed',
        'shipped',
        'delivered',
        'cancelled',
        'return_requested',
        'returned',
        'refunded',
        'pending',
        'processing',
      ],
      default: 'created',
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    invoiceGeneratedAt: Date,
    trackingId: {
      type: String,
      trim: true,
      default: '',
    },
    deliveryPartner: {
      type: String,
      trim: true,
      default: '',
    },
    estimatedDeliveryDate: Date,
    estimatedDeliveryMinDays: {
      type: Number,
      min: 1,
      max: 30,
    },
    estimatedDeliveryMaxDays: {
      type: Number,
      min: 1,
      max: 45,
    },
    shipmentCreatedAt: Date,
  },
  { _id: true },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    subtotalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'stripe'],
      default: 'stripe',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: [
        'created',
        'payment_pending',
        'paid',
        'confirmed',
        'packed',
        'shipped',
        'delivered',
        'cancelled',
        'return_requested',
        'returned',
        'refunded',
        'pending',
        'processing',
      ],
      default: 'created',
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    paymentDetails: {
      type: paymentDetailsSchema,
      default: () => ({}),
    },
    inventoryProcessed: {
      type: Boolean,
      default: false,
    },
    inventoryReservedAt: Date,
    reservationExpiresAt: Date,
    inventoryReleasedAt: Date,
    cancelReason: {
      type: String,
      trim: true,
      default: '',
    },
    refundReason: {
      type: String,
      trim: true,
      default: '',
    },
    cancelledAt: Date,
    refundedAt: Date,
    deliveredAt: Date,
    vendors: {
      type: [
        {
          vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
          },
          vendorName: {
            type: String,
            trim: true,
          },
          items: {
            type: [mongoose.Schema.Types.ObjectId],
            default: [],
          },
          itemCount: {
            type: Number,
            default: 0,
          },
          subtotal: {
            type: Number,
            default: 0,
          },
          commission: {
            type: Number,
            default: 0,
          },
          vendorEarnings: {
            type: Number,
            default: 0,
          },
          status: {
            type: String,
            enum: [
              'created',
              'payment_pending',
              'paid',
              'confirmed',
              'packed',
              'shipped',
              'delivered',
              'cancelled',
              'return_requested',
              'returned',
              'refunded',
              'pending',
              'processing',
            ],
            default: 'created',
          },
          invoiceNumber: {
            type: String,
            trim: true,
            default: '',
          },
          invoiceGeneratedAt: Date,
          trackingId: {
            type: String,
            trim: true,
            default: '',
          },
          deliveryPartner: {
            type: String,
            trim: true,
            default: '',
          },
          estimatedDeliveryDate: Date,
          estimatedDeliveryMinDays: {
            type: Number,
            min: 1,
            max: 30,
          },
          estimatedDeliveryMaxDays: {
            type: Number,
            min: 1,
            max: 45,
          },
          shipmentCreatedAt: Date,
        },
      ],
      default: [],
    },
    subOrders: {
      type: [subOrderSchema],
      default: [],
    },
    returns: {
      type: [
        {
          itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
          },
          reason: {
            type: String,
            trim: true,
            required: true,
          },
          issueType: {
            type: String,
            enum: ['wrong_item', 'defective', 'not_received', 'size_issue', 'other'],
            required: true,
          },
          status: {
            type: String,
            enum: ['requested', 'approved', 'rejected', 'processed'],
            default: 'requested',
          },
          requestedAt: {
            type: Date,
            default: Date.now,
          },
          reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
          },
          reviewedAt: Date,
          adminDisputed: {
            type: Boolean,
            default: false,
          },
          adminReviewedAt: Date,
          refundAmount: Number,
          refundedAt: Date,
          vendorNote: {
            type: String,
            trim: true,
            default: '',
          },
        },
      ],
      default: [],
    },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'partial', 'full'],
      default: 'none',
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ 'items.vendor': 1, createdAt: -1 });
orderSchema.index({ 'vendors.vendor': 1, 'vendors.status': 1, createdAt: -1 });
orderSchema.index({ 'subOrders.vendor': 1, 'subOrders.status': 1, createdAt: -1 });
orderSchema.index({ reservationExpiresAt: 1, paymentStatus: 1, orderStatus: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
