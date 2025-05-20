const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');
const upload = require('../../utils/uplaod');
const deleteOldFiles = require('../../utils/deletefiles');

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

module.exports = router;