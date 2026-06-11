import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    subOrderId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    subOrderNumber: {
      type: String,
      trim: true,
      default: '',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    commission: {
      type: Number,
      required: true,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['sale', 'payout', 'refund', 'adjustment'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    processedAt: Date,
  },
  { _id: true },
);

const walletSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPayouts: {
      type: Number,
      default: 0,
      min: 0,
    },
    transactions: [transactionSchema],
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

walletSchema.index({ 'transactions.orderId': 1 });
walletSchema.index({ 'transactions.status': 1 });
walletSchema.index({ 'transactions.subOrderId': 1 });
walletSchema.index({ vendor: 1, updatedAt: -1 });

const VendorWallet = mongoose.model('VendorWallet', walletSchema);

export default VendorWallet;
