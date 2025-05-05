// api/ProductSpecification/index.js
const express = require('express');
const router = express.Router();

// Import controllers
const getAllProductSpecifications = require('../../controllers/ProductSpecification/getAllProductSpecifications');
const getProductSpecificationBySysId = require('../../controllers/ProductSpecification/getProductSpecificationBySysId');
const syncFromServiceNow = require('../../controllers/ProductSpecification/syncFromServiceNow');

// Route for receiving product specifications from ServiceNow
router.post('/send-specification', syncFromServiceNow);

// Route to get all product specifications
router.get('/', getAllProductSpecifications);

// Route to get product specification by sys_id
router.get('/:sysId', getProductSpecificationBySysId);

module.exports = router;