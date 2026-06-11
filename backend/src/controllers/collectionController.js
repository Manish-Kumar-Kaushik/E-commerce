import asyncHandler from '../utils/asyncHandler.js';
import {
  createCollection,
  deleteCollection,
  getCollectionBySlug,
  getCollections,
  updateCollection,
} from '../services/collectionService.js';

export const getCollectionsController = asyncHandler(async (req, res) => {
  const collections = await getCollections(req.query);

  res.status(200).json({
    success: true,
    collections,
  });
});

export const getCollectionController = asyncHandler(async (req, res) => {
  const collection = await getCollectionBySlug(req.params.slug, req.query);

  res.status(200).json({
    success: true,
    ...collection,
  });
});

export const createCollectionController = asyncHandler(async (req, res) => {
  const collection = await createCollection(req.body);

  res.status(201).json({
    success: true,
    message: 'Collection created successfully',
    collection,
  });
});

export const updateCollectionController = asyncHandler(async (req, res) => {
  const collection = await updateCollection(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: 'Collection updated successfully',
    collection,
  });
});

export const deleteCollectionController = asyncHandler(async (req, res) => {
  await deleteCollection(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Collection deleted successfully',
  });
});
