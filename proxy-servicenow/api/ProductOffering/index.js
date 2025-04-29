const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOffering = require('../../models/ProductOffering');

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


//Get product specifications

router.get('/product-spec', async (req, res) => {
  try {
    // Verify JWT
    const authHeader = req.headers.authorization;
    
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid token', details: jwtError.message });
    }

    // ServiceNow configuration
    const serviceNowUrl = `${process.env.SERVICE_NOW_URL}/api/sn_tmf_api/catalogmanagement/productSpecification`;
    const serviceNowHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${decodedToken.sn_access_token}` // or 'Token' as needed
    };

    // ServiceNow API call with query parameters
    const response = await axios.get(serviceNowUrl, {
      headers: serviceNowHeaders,
      params: req.query // Forward client query parameters to ServiceNow
    });

    // Forward successful response
    res.status(response.status).json(response.data);

  } catch (error) {
    console.error('ServiceNow API error:', error);

    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: 'ServiceNow API request failed',
        details: error.response?.data || error.message
      });
    }

    // Handle other errors
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

router.get('/channel', async (req, res) => {
  try {
    // Verify JWT
    const authHeader = req.headers.authorization;
    
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid token', details: jwtError.message });
    }

    // ServiceNow configuration
    const serviceNowUrl = `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_distribution_channel`;
    const serviceNowHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${decodedToken.sn_access_token}` // or 'Token' as needed
    };

    // ServiceNow API call with query parameters
    const response = await axios.get(serviceNowUrl, {
      headers: serviceNowHeaders,
      params: req.query // Forward client query parameters to ServiceNow
    });

    // Forward successful response
    res.status(response.status).json(response.data);

  } catch (error) {
    console.error('ServiceNow API error:', error);

    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: 'ServiceNow API request failed',
        details: error.response?.data || error.message
      });
    }

    // Handle other errors
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});


router.get('/product-offering', async(req, res) =>{
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const skip = (page - 1) * limit;
  
      const [data, total] = await Promise.all([
        ProductOffering.find().skip(skip).limit(limit),
        ProductOffering.countDocuments()
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
})

router.get('/servicenow/product-offering', async (req, res) => {
  try {
    // Verify JWT
    const authHeader = req.headers.authorization;
    
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid token', details: jwtError.message });
    }

    // ServiceNow configuration
    const serviceNowUrl = `${process.env.SERVICE_NOW_URL}/api/sn_tmf_api/catalogmanagement/productOffering`;
    const serviceNowHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${decodedToken.sn_access_token}` // or 'Token' as needed
    };

    // ServiceNow API call with query parameters
    const response = await axios.get(serviceNowUrl, {
      headers: serviceNowHeaders,
      params: req.query // Forward client query parameters to ServiceNow
    });
    
    // Forward successful response
    res.status(response.status).json(response.data);

  } catch (error) {
    console.error('ServiceNow API error:', error);

    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: 'ServiceNow API request failed',
        details: error.response?.data || error.message
      });
    }

    // Handle other errors
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

router.get('/servicenow/product-offering/:sys_id', async (req, res) => {
  try {
    // Verify JWT
    const authHeader = req.headers.authorization;

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid token', details: jwtError.message });
    }

    // ServiceNow configuration with sys_id
    const sysId = encodeURIComponent(req.params.sys_id); // URL-encode for safety
    const serviceNowUrl = `${process.env.SERVICE_NOW_URL}/api/sn_tmf_api/catalogmanagement/productOffering/${sysId}`;
    
    const serviceNowHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${decodedToken.sn_access_token}` // or 'Token' as needed
    };

    // ServiceNow API call
    const response = await axios.get(serviceNowUrl, {
      headers: serviceNowHeaders,
      params: req.query // Still forward query parameters (optional)
    });

    // Forward response
    res.status(response.status).json(response.data);

  } catch (error) {
    console.error('ServiceNow API error:', error);

    // Axios error handling
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: 'ServiceNow API request failed',
        details: error.response?.data || error.message
      });
    }

    // General error handling
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

router.get('/product-offering/:sys_id', async (req, res) => {
  try {
    const data = await ProductOffering.findOne({ sys_id: req.params.sys_id });
    if (!data) return res.status(404).send({ message: 'Product Offering not found' });
    res.send(data);
  } catch (err) {
    res.status(500).send(err);
  }
});


// Get all Product Offerings (Still uses MongoDB)

// router.get('/product-offerings', async (req, res) => {
//   try {
//     const offerings = await ProductOffering.find()
//       .populate('productSpecification')
//       .populate('category');
//     res.json(offerings);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Get Product Offering by ID (Still uses MongoDB)
// router.get('/product-offering/:id', async (req, res) => {
//   try {
//     const offering = await ProductOffering.findById(req.params.id)
//       .populate('productSpecification')
//       .populate('category');

//     if (!offering) {
//       return res.status(404).json({ message: 'Product offering not found' });
//     }
//     res.json(offering);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Create Product Offering (Only ServiceNow)
router.post('/product-offering', async (req, res) => {
  try {
    // Authentication and Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });
    
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validation
    const requiredFields = ['name', 'productSpecification', 'productOfferingPrice'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing: missingFields
      });
    }
    // console.log(JSON.stringify(req.body, null, 2));
    // Prepare ServiceNow payload
    const snPayload = {
      name: req.body.name,
      version: req.body.version, // Default or fetch if needed
      internalVersion: req.body.internalVersion, // Default or fetch if needed
      description: req.body.description,
      lastUpdate: "", // Set current time, adjust if needed
      validFor: req.body.validFor,
      productOfferingTerm: req.body.productOfferingTerm,
      productOfferingPrice: req.body.productOfferingPrice,
      productSpecification: req.body.productSpecification,
        prodSpecCharValueUse: req.body.prodSpecCharValueUse,
      channel: req.body.channel,
      category: req.body.category,
      lifecycleStatus: req.body.lifecycleStatus,
      status: req.body.status
    };

    // ServiceNow API Call
    const snResponse = await axios.post(
      `${process.env.SERVICE_NOW_URL}/api/sn_tmf_api/catalogmanagement/productOffering`,
      snPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${decoded.sn_access_token}`
        }
      }
    );

    //console.log(JSON.stringify(snResponse.data.result, null, 2));

     // MongoDB Create
        try {
          const snRecord = snResponse.data;
          const mongoDoc = new ProductOffering({    
            ...snRecord
          });
          await mongoDoc.save();
        } catch (mongoError) {
          return handleMongoError(res, snResponse.data, mongoError, 'creation');
        }

    res.status(201).json(snResponse.data);

  } catch (error) {
    console.error('Error creating product offering:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
});

// Update Product Offering (Only ServiceNow)
router.patch('/product-offering/:id', async (req, res) => {
  try {
    // Authentication
    const authHeader = req.headers.authorization;
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate allowed fields
    const allowedFields = [
      'name', 'displayName', 'description', 'lifecycleStatus',
      'productOfferingTerm', 'validFor', 'productOfferingPrice',
      'prodSpecCharValueUse', 'channel', 'category', 'status'
    ];
    
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedFields.includes(update));
    
    // if (!isValidOperation) {
    //   return res.status(400).json({ error: 'Invalid updates!' });
    // }
   
    // ServiceNow Update
    const snResponse = await axios.patch(
      `${process.env.SERVICE_NOW_URL}/api/sn_tmf_api/catalogmanagement/productOffering/${req.params.id}`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${decoded.sn_access_token}`
        }
      }
    );

     // MongoDB Update
    try {
      await ProductOffering.updateOne(
        { id: req.params.id },
        { $set: snResponse.data },
        { runValidators: true }
      );
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'update');
    }

    res.json(snResponse.data);

  } catch (error) {
    console.error('Error updating product offering:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
});

router.patch('/product-offering-status', async (req, res)=>{
  
  try{
    
    const authHeader = req.headers.authorization;
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate allowed fields
    const allowedFields = ['sys_id', 'status'];
    
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedFields.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Only two fields allowed: sys_id & status!' });
    }
   

    const snResponse = await axios.patch(
      `${process.env.SERVICE_NOW_URL}/api/1598581/product_offering_api/po_pub`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${decoded.sn_access_token}`
        }
      }
    );

    res.json(snResponse.data);
    
  } catch (error) {
    console.error('Error update product offering\'s state: ', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
});

// Delete Product Offering (Only ServiceNow)
router.delete('/product-offering/:id', async (req, res) => {
  try {
    // Authentication
    const authHeader = req.headers.authorization;
    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Invalid authorization format' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Delete from ServiceNow
    const snResponse = await axios.delete(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering/${req.params.id}`,
      {
        headers: {
          'Authorization': `Bearer ${decoded.sn_access_token}`
        }
      }
    );

     // MongoDB Delete
    try {
      await ProductOffering.deleteOne({id: req.params.id });
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'deletion');
    }

    res.json(snResponse.data);

  } catch (error) {
    console.error('Error deleting product offering:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
});

module.exports = router;