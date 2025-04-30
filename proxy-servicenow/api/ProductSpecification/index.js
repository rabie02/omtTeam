const express = require('express');
const router = express.Router();
const ProductSpecification = require('../../models/productSpecification');
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

// Endpoint to receive product specifications from ServiceNow
router.post('/', async (req, res) => {
  try {
    console.log('Received specification data:', req.body);
    
    const {
      sys_id,
      display_name,
      specification_category,
      specification_type,
      start_date,
      description,
      status
    } = req.body;

    // Map ServiceNow fields to your MongoDB model fields
    const productSpecData = {
      id: sys_id,
      name: specification_type || '',
      displayName: display_name || '',
      description: description || '',
      status: status || '',
      validFor: {
        startDateTime: start_date ? new Date(start_date) : new Date(),
        endDateTime: null
      },
      lastUpdate: new Date(),
      // Set default values for required fields
      version: '1.0',
      internalVersion: '1.0',
      internalId: sys_id,
      lifecycleStatus: status,
      isBundle: false,
      serviceSpecification: [],
      productSpecificationRelationship: [],
      resourceSpecification: [],
      productSpecCharacteristic: []
    };

    try {
      // Find and update if exists, otherwise create new
      const result = await ProductSpecification.findOneAndUpdate(
        { id: sys_id },
        productSpecData,
        { upsert: true, new: true }
      );

      console.log('Product specification saved to MongoDB:', result.id);
      res.status(200).json({
        success: true,
        message: 'Product specification saved successfully',
        data: result
      });
    } catch (mongoError) {
      return handleMongoError(res, req.body, mongoError, 'upsert');
    }
  } catch (error) {
    console.error('Error processing product specification:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing product specification',
      error: error.message
    });
  }
});

// GET ALL (with pagination)
router.get('/product-specification', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ProductSpecification.find().skip(skip).limit(limit),
      ProductSpecification.countDocuments()
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
router.get('/product-specification/:id', async (req, res) => {
  try {
    const data = await ProductSpecification.findOne({ id: req.params.id });
    if (!data) return res.status(404).send({ message: 'Specification not found' });
    res.send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Add this route to handle deletions
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Received delete request for product specification: ${id}`);
    
    // Delete from MongoDB
    const result = await ProductSpecification.deleteOne({ id: id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product specification not found'
      });
    }
    
    console.log(`Product specification deleted from MongoDB: ${id}`);
    res.status(200).json({
      success: true,
      message: 'Product specification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product specification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product specification',
      error: error.message
    });
  }
});

module.exports = router;