import mongoose from 'mongoose';

const bankDetailsSchema = new mongoose.Schema(
  {
    accountHolderName: {
      type: String,
      trim: true,
      default: '',
    },
    accountNumber: {
      type: String,
      trim: true,
      default: '',
    },
    ifscCode: {
      type: String,
      trim: true,
      default: '',
    },
    bankName: {
      type: String,
      trim: true,
      default: '',
    },
    branchName: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false },
);

const kycDocumentsSchema = new mongoose.Schema(
  {
    panCard: {
      type: String,
      trim: true,
      default: '',
    },
    gstNumber: {
      type: String,
      trim: true,
      default: '',
    },
    businessLicense: {
      type: String,
      trim: true,
      default: '',
    },
    aadharCard: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false },
);

const vendorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      trim: true,
      default: '',
    },
    fullName: {
      type: String,
      trim: true,
      default: '',
    },
    storeName: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: '',
    },
    storeSlug: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: '',
    },
    businessType: {
      type: String,
      trim: true,
      default: '',
    },
    businessLogo: {
      type: String,
      trim: true,
      default: '',
    },
    storeBanner: {
      type: String,
      trim: true,
      default: '',
    },
    businessDescription: {
      type: String,
      trim: true,
      default: '',
    },
    businessEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    businessPhone: {
      type: String,
      trim: true,
      default: '',
    },
    businessPhoneVerified: {
      type: Boolean,
      default: false,
    },
    businessPhoneVerifiedAt: {
      type: Date,
      default: null,
    },
    businessPhoneVerifiedEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    businessAddress: {
      line1: { type: String, trim: true, default: '' },
      line2: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: 'India' },
    },
    alternateContact: {
      type: String,
      trim: true,
      default: '',
    },
    pickupAddress: {
      type: String,
      trim: true,
      default: '',
    },
    pincode: {
      type: String,
      trim: true,
      default: '',
    },
    panCardNumber: {
      type: String,
      trim: true,
      default: '',
    },
    aadhaarNumber: {
      type: String,
      trim: true,
      default: '',
    },
    bankDetails: {
      type: bankDetailsSchema,
      default: () => ({}),
    },
    kycDocuments: {
      type: kycDocumentsSchema,
      default: () => ({}),
    },
    documentUploads: {
      panCardImage: { type: String, trim: true, default: '' },
      cancelledCheque: { type: String, trim: true, default: '' },
      addressProof: { type: String, trim: true, default: '' },
      gstCertificate: { type: String, trim: true, default: '' },
    },
    storeCategories: {
      type: [String],
      default: [],
    },
    returnPolicy: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    trustLevel: {
      type: String,
      enum: ['new', 'verified', 'trusted', 'premium'],
      default: 'new',
    },
    trustedAt: Date,
    rejectedReason: {
      type: String,
      trim: true,
      default: '',
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    totalSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
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

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;