const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = require('../../utils/uplaod');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');
const deleteOldFiles = require('../../utils/deletefiles')


const router = express.Router();
require('dotenv').config();

// Error handling helper
const handleMongoError = (res, serviceNowData, error, operation) => {
  console.error(`MongoDB ${operation} error:`, error);
  return res.status(500).json({
    error: `Operation partially failed - Success in ServiceNow but failed in MongoDB (${operation})`,
    serviceNowSuccess: serviceNowData,
    mongoError: error.message
  });
};

// GET ALL (with pagination)
router.get('/product-offering-category', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ProductOfferingCategory.find().skip(skip).limit(limit),
      ProductOfferingCategory.countDocuments()
    ]);

    const dataWithImages = data.map(item => ({
      ...item.toObject(),
      image: item.image ? `${req.protocol}://${req.get('host')}/images/category/${item.image}` : '',
      thumbnail: item.thumbnail ? `${req.protocol}://${req.get('host')}/images/category/${item.thumbnail}` : ''
    }));

    res.send({
      data: data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

// GET BY ID
router.get('/product-offering-category/:sys_id', async (req, res) => {
  try {
    const data = await ProductOfferingCategory.findOne({ sys_id: req.params.sys_id });
    if (!data) return res.status(404).send({ message: 'Category not found' });
    res.send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

// CREATE
router.post('/product-offering-category', async (req, res) => {
  try {
    // Authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authorization required' });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Validation
    if (!req.body.name || !req.body.code || typeof req.body.is_leaf === 'undefined') {
      return res.status(400).json({
        error: 'Missing required fields: name, code, is_leaf'
      });
    }

    // ServiceNow Request
    const snResponse = await axios.post(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_category`,
      {
        name: req.body.name,
        code: req.body.code,
        is_leaf: req.body.is_leaf,
        start_date: req.body.start_date || new Date().toISOString(),
        end_date: req.body.end_date || null,
        description: req.body.description
      },
      {
        headers: {
          'Authorization': `Bearer ${decodedToken.sn_access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // MongoDB Create
    try {
      const snRecord = snResponse.data.result;
      const mongoDoc = new ProductOfferingCategory({
        sys_id: snRecord.sys_id,
        ...snRecord
      });
      await mongoDoc.save();
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'creation');
    }

    res.status(201).json(snResponse.data);

  } catch (error) {
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: 'ServiceNow API failed',
        details: error.response?.data || error.message
      });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

router.patch(
  '/product-offering-category/:sys_id',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      // Authentication
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Authorization required' });
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const { sys_id } = req.params;

      // Fetch existing category to get old file paths
      const existingCategory = await ProductOfferingCategory.findOne({ sys_id });
      if (!existingCategory) {
        return res.status(404).json({ error: 'Category not found' });
      }
      const oldImage = existingCategory.image;
      const oldThumbnail = existingCategory.thumbnail;

      // Process uploaded files
      const filePaths = {};
      if (req.files) {
        ['image', 'thumbnail'].forEach(field => {
          if (req.files[field]) {
            const file = req.files[field][0];
            filePaths[field] = `${file.filename}`; // No leading slash    
          }
        });
      }

      // Prepare update body
      const updateBody = {
        ...req.body,
        ...filePaths
      };

      // Field Filtering
      const allowedFields = [
        'name', 'code', 'is_leaf', 'start_date',
        'end_date', 'description', 'image', 'thumbnail'
      ];

      // Filter and clean fields
      const filteredUpdate = {};
      allowedFields.forEach(field => {
        if (updateBody[field] !== undefined) {
          filteredUpdate[field] = updateBody[field] === "" ? null : updateBody[field];
        }
      });

      // ServiceNow Update
      const snResponse = await axios.patch(
        `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_category/${sys_id}`,
        filteredUpdate,
        {
          headers: {
            'Authorization': `Bearer ${decodedToken.sn_access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // MongoDB Update
      try {
        await ProductOfferingCategory.updateOne(
          { sys_id: sys_id },
          { $set: snResponse.data.result },
          { runValidators: true }
        );
      } catch (mongoError) {
        return handleMongoError(res, snResponse.data, mongoError, 'update');
      }

      // Delete old files after successful updates

      deleteOldFiles(oldImage, oldThumbnail);

      res.json(snResponse.data);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        return res.status(status).json({
          error: status === 404 ? 'Not found' : 'ServiceNow update failed',
          details: error.response?.data || error.message
        });
      }
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
);

// DELETE
router.delete('/product-offering-category/:sys_id', async (req, res) => {
  try {
    // Authentication
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authorization required' });
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const { sys_id } = req.params;

    // Fetch existing category to get old file paths
    const existingCategory = await ProductOfferingCategory.findOne({ sys_id });
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const oldImage = existingCategory.image;
    const oldThumbnail = existingCategory.thumbnail;



    // ServiceNow Delete
    const snResponse = await axios.delete(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_category/${sys_id}`,
      {
        headers: { 'Authorization': `Bearer ${decodedToken.sn_access_token}` }
      }
    );

    // MongoDB Delete
    try {
      await ProductOfferingCategory.deleteOne({ sys_id: sys_id });
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'deletion');
    }

    // Delete old files

    deleteOldFiles(oldImage, oldThumbnail);

    res.status(204).end();

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      return res.status(status).json({
        error: status === 404 ? 'Not found' : 'ServiceNow delete failed',
        details: error.response?.data || error.message
      });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;