const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');
const handleMongoError = require('../../utils/handleMongoError');
const getone = require('./getone')


module.exports = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!req.body.name || !req.body.code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }
    
    const body = req.body;

    const snResponse = await axios.post(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_catalog`,
      {
        name: req.body.name,
        code: req.body.code,
        description: req.body.description || '',
        start_date: req.body.start_date || new Date().toISOString(),
        start_end : req.body.start_end || null,
        status: "draft"
      },
      {
        headers: {
          'Authorization': `Bearer ${decodedToken.sn_access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let mongoDoc;
    try {
      mongoDoc = new ProductOfferingCatalog(snResponse.data.result);
      await mongoDoc.save();
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'creation');
    }

     const result = await getone( mongoDoc._id )
        const responseData = {
          result
        };

  
    res.status(201).json(responseData);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: 'ServiceNow API failed',
        details: error.response?.data || error.message
      });
    }
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};