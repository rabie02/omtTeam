
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');

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
router.get('/product-offering-catalog', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ProductOfferingCatalog.find().skip(skip).limit(limit),
      ProductOfferingCatalog.countDocuments()
    ]);

    res.send({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

// GET BY ID
router.get('/product-offering-catalog/:sys_id', async (req, res) => {
  try {
    const data = await ProductOfferingCatalog.findOne({ sys_id: req.params.sys_id });
    if (!data) return res.status(404).send({ message: 'Catalog not found' });
    res.send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

// CREATE
router.post('/product-offering-catalog', async (req, res) => {
  try {
    // Authentication
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Validation
    if (!req.body.name || !req.body.code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    // ServiceNow Request
    const snResponse = await axios.post(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_catalog`,
      {
        name: req.body.name,
        code: req.body.code,
        start_date: req.body.start_date || new Date().toISOString(),
        status: "draft"
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
      const mongoDoc = new ProductOfferingCatalog({    
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

// UPDATE
router.patch('/product-offering-catalog/:sys_id', async (req, res) => {
  try {
    // Authentication
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const { sys_id } = req.params;

    // Field Filtering
    const allowedFields = [
      'end_date', 'image', 'thumbnail', 'description', 'external_id',
      'is_default', 'external_source', 'status', 'name', 'hierarchy_json', 'leaf_categories'
    ];
    
    const updateBody = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateBody[field] = req.body[field] === "" ? null : req.body[field];
      }
    });

    // ServiceNow Update
    const snResponse = await axios.patch(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_catalog/${sys_id}`,
      updateBody,
      {
        headers: {
          'Authorization': `Bearer ${decodedToken.sn_access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // MongoDB Update
    try {
      await ProductOfferingCatalog.updateOne(
        { sys_id: sys_id },
        { $set: snResponse.data.result },
        { runValidators: true }
      );
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'update');
    }

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
});

// DELETE
router.delete('/product-offering-catalog/:sys_id', async (req, res) => {
  try {
    // Authentication
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const { sys_id } = req.params;

    // ServiceNow Delete
    const snResponse = await axios.delete(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_catalog/${sys_id}`,
      {
        headers: { 'Authorization': `Bearer ${decodedToken.sn_access_token}` },
        params: { sysparm_suppress_auto_sys_field: true }
      }
    );

    // MongoDB Delete
    try {
      await ProductOfferingCatalog.deleteOne({sys_id: sys_id });
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'deletion');
    }

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
