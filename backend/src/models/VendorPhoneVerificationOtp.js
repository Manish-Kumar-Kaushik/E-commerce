import mongoose from 'mongoose';

const vendorPhoneVerificationOtpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    businessEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    businessPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

vendorPhoneVerificationOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VendorPhoneVerificationOtp = mongoose.model('VendorPhoneVerificationOtp', vendorPhoneVerificationOtpSchema);

export default VendorPhoneVerificationOtp;
