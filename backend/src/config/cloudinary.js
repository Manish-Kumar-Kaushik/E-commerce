import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

const requiredCloudinaryConfig = {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

const missingCloudinaryConfig = Object.entries(requiredCloudinaryConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

const isCloudinaryConfigured = missingCloudinaryConfig.length === 0;

if (missingCloudinaryConfig.length && missingCloudinaryConfig.length < Object.keys(requiredCloudinaryConfig).length) {
  logger.warn(`Cloudinary is partially configured. Missing: ${missingCloudinaryConfig.join(', ')}`);
}

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export { cloudinary, isCloudinaryConfigured, missingCloudinaryConfig };
