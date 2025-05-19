const axios = require('axios');
const ProductOfferingPrice = require('../../models/productOfferingPrice');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

async function createProductOfferingPrice(req, res = null) {
  try {
    // 1. Create in ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/sn_tmf_api/catalogmanagement/productOfferingPrice`,
      req.body,
      { headers: connection.headers }
    );

    // 2. Prepare MongoDB document from ServiceNow response
    const snData = snResponse.data;
    const mongoPrice = new ProductOfferingPrice({
      sys_id: snData.id,
      name: snData.name,
      price: {
        unit: snData.price?.units,
        value: snData.price?.value
      },
      lifecycleStatus: snData.lifecycleStatus,
      validFor: {
        startDateTime: snData.validFor?.startDateTime ? new Date(snData.validFor.startDateTime) : null,
        endDateTime: snData.validFor?.endDateTime ? new Date(snData.validFor.endDateTime) : null
      },
      productOffering: {
        id: snData.productOffering?.id,
        name: snData.productOffering?.name
      },
      priceType: snData.priceType,
      recurringChargePeriodType: snData.recurringChargePeriodType,
      unitOfMeasure: snData.unitOfMeasure,
      priceList: snData.priceList,
      "@type": snData["@type"] || "ProductOfferingPrice"
    });

    // 3. Save to MongoDB
    try {
      await mongoPrice.save();
      
      // 4. Return success response
      res.status(201).json({
        serviceNow: snData,
        mongoDB: mongoPrice.toObject()
      });
      
    } catch (mongoError) {
      return handleMongoError(res, snData, mongoError, 'creation');
    }

  } catch (error) {
    console.error('Error creating product offering price:', error);
    
    // Handle ServiceNow errors
    if (error.response?.data?.error) {
      return res.status(error.response.status).json({
        error: error.response.data.error.message,
        details: error.response.data.error.details
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};