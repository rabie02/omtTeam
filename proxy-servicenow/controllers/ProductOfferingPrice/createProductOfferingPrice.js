const axios = require('axios');
const ProductOfferingPrice = require('../../models/productOfferingPrice');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const ProductOffering = require('../../models/ProductOffering');
const PriceList = require('../../models/priceList');

async function createProductOfferingPrice(req, res = null) {


  try {
    let productOffering;
    let priceList;

    try {
      productOffering = await ProductOffering.findById(req.body.productOffering.id);
      priceList = await PriceList.findById(req.body.priceList.id)
      let payload = {
        ...req.body,
        priceList: {
          id: priceList.sys_id
        },
        productOffering: {
          id: productOffering.id
        }

      }
      //1. Create in ServiceNow
      const connection = snConnection.getConnection(req.user.sn_access_token);
      const snResponse = await axios.post(
        `${connection.baseURL}/api/sn_tmf_api/catalogmanagement/productOfferingPrice`,
        payload,
        { headers: connection.headers }
      );

      // 2. Prepare MongoDB document from ServiceNow response
      const snData = snResponse.data;
      const mongoPayload = {
        "sys_id": snData.id,
        "name": snData.name,
        "price": snData.price,
        "lifecycleStatus": snData.lifecycleStatus,
        "validFor": snData.validFor,
        "productOffering": productOffering._id,
        "priceType": snData.priceType,
        "recurringChargePeriodType": snData.recurringChargePeriodType,
        "unitOfMeasure": snData.unitOfMeasure,
        "priceList": priceList._id,
        "@type": "ProductOfferingPrice",
        "id": snData.id,
        "state": snData.state,
        "href": snData.href
      }
      //console.log(JSON.stringify(mongoPayload,null, 2));
      const mongoPrice = new ProductOfferingPrice(mongoPayload);

      // 3. Save to MongoDB
      try {
        await mongoPrice.save();

        if (res) {
          // 4. Return success response
          res.status(201).json({
            ...snData,
            _id: mongoPrice._id.toString(), // Include MongoDB ID in the response
            mongoId: mongoPrice._id.toString() // Alternative field name if preferred
          });
        }

      } catch (mongoError) {
        return handleMongoError(res, snData, mongoError, 'creation');
      }

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



// Original Express route handler for backward compatibility
module.exports = async (req, res) => {
  return createProductOfferingPrice(req, res);
};

// Export the function directly as well
module.exports.createProductOfferingPrice = createProductOfferingPrice;