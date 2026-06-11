import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

const uploadsRoot = path.join(process.cwd(), 'uploads', 'products');

const ensureUploadsDirectory = async () => {
  await mkdir(uploadsRoot, { recursive: true });
};

const sanitizeFileExtension = (file) => {
  const originalExtension = path.extname(file.originalname || '').toLowerCase();

  if (originalExtension && originalExtension.length <= 10) {
    return originalExtension;
  }

  const mimeExtension = file.mimetype?.split('/')[1]?.toLowerCase();
  return mimeExtension ? `.${mimeExtension.replace(/[^a-z0-9]/g, '')}` : '.jpg';
};

const saveImagesLocally = async (files, baseUrl) => {
  await ensureUploadsDirectory();

  return Promise.all(
    files.map(async (file) => {
      const extension = sanitizeFileExtension(file);
      const fileName = `${Date.now()}-${randomUUID()}${extension}`;
      const filePath = path.join(uploadsRoot, fileName);

      await writeFile(filePath, file.buffer);

      return {
        url: `${baseUrl}/media/products/${fileName}`,
        publicId: `local-${fileName}`,
      };
    }),
  );
};

export const uploadImages = async (files, { baseUrl }) => {
  if (!files || !files.length) {
    throw new ApiError(400, 'At least one image file is required');
  }

  if (!baseUrl) {
    throw new ApiError(500, 'Upload base URL is missing');
  }

  if (!isCloudinaryConfigured || process.env.NODE_ENV === 'development') {
    return saveImagesLocally(files, baseUrl);
  }

  try {
    const uploads = await Promise.all(
      files.map(async (file) => {
        const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64Data, {
          folder: process.env.CLOUDINARY_FOLDER || 'ecommerce/products',
          resource_type: 'auto',
        });

        return {
          url: result.secure_url,
          publicId: result.public_id,
        };
      }),
    );

    return uploads;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      return saveImagesLocally(files, baseUrl);
    }

    throw new ApiError(500, `Image upload failed: ${error.message}`);
  }
};
