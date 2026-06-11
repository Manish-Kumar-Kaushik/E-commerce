import mongoose from 'mongoose';
import slugify from '../utils/slugify.js';

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    basePrice: {
      type: Number,
      min: 0,
      default: null,
    },
    gstRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    gstAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    isPriceInclusiveOfGst: {
      type: Boolean,
      default: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
      default: null,
      validate: {
        validator(value) {
          return value === null || value <= this.price;
        },
        message: 'Discount price must be less than or equal to price',
      },
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    collection: {
      type: String,
      trim: true,
      default: '',
    },
    collectionSlug: {
      type: String,
      trim: true,
      default: '',
      lowercase: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    attributes: {
      type: [
        {
          section: {
            type: String,
            trim: true,
            default: 'Specifications',
          },
          key: {
            type: String,
            trim: true,
            default: '',
          },
          label: {
            type: String,
            trim: true,
            required: true,
          },
          value: {
            type: String,
            trim: true,
            required: true,
          },
        },
      ],
      default: [],
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    colorImages: {
      type: Map,
      of: [imageSchema],
      default: () => ({}),
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isCelebrityCloset: {
      type: Boolean,
      default: false,
    },
    isLuxe: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: false,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    approvedAt: Date,
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewsCount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    suppressReservedKeysWarning: true,
    timestamps: true,
    toJSON: {
      flattenMaps: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  },
);

productSchema.index({ name: 'text', category: 1, collectionSlug: 1 });
productSchema.index({ vendor: 1, createdAt: -1 });
productSchema.index({ approvalStatus: 1, isPublished: 1, createdAt: -1 });
productSchema.index({ category: 1, isPublished: 1, createdAt: -1 });

productSchema.pre('validate', function setProductSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }

  if (!this.collectionSlug && this.collection) {
    this.collectionSlug = slugify(this.collection);
  }

  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
