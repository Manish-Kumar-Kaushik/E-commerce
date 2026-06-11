import mongoose from 'mongoose';
import slugify from '../utils/slugify.js';

const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    bannerImage: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
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

collectionSchema.pre('validate', function setCollectionSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }

  next();
});

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;
