const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');
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