const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOffering = require('../../models/ProductOffering');
const handleMongoError = require('../../utils/handleMongoError');


// Create Product Offering 
module.exports = async (req, res) => {
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
    let mongoDoc;
     // MongoDB Create
        try {
          const snRecord = snResponse.data;
          mongoDoc = new ProductOffering({    
            ...snRecord
          });
          await mongoDoc.save();
        } catch (mongoError) {
          return handleMongoError(res, snResponse.data, mongoError, 'creation');
        }
    const responseData = {
      result: {
        ...snResponse.data,
        _id: mongoDoc._id,  // Add MongoDB _id to the result
      },
    };

    res.status(201).json(responseData);

  } catch (error) {
    console.error('Error creating product offering:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};