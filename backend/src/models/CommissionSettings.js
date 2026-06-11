import mongoose from 'mongoose';

const categoryCommissionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: true },
);

const vendorCommissionSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: true },
);

const commissionSettingsSchema = new mongoose.Schema(
  {
    globalCommissionRate: {
      type: Number,
      default: 15,
      min: 0,
      max: 100,
    },
    categoryCommissions: [categoryCommissionSchema],
    vendorCommissions: [vendorCommissionSchema],
    payoutSchedule: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      default: 'weekly',
    },
    minimumPayoutAmount: {
      type: Number,
      default: 500,
      min: 0,
    },
    payoutProcessingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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

commissionSettingsSchema.index({ 'categoryCommissions.category': 1 });
commissionSettingsSchema.index({ 'vendorCommissions.vendor': 1 });

const CommissionSettings = mongoose.model('CommissionSettings', commissionSettingsSchema);

export default CommissionSettings;