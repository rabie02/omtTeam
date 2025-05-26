const axios = require('axios');
const ProductOfferingPrice = require('../../models/productOfferingPrice');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const ProductOffering = require('../../models/ProductOffering');
const PriceList = require('../../models/priceList');

async function createProductOfferingPrice(req, res = null) {

  
  try {
    const [productOffering, priceList] = await Promise.all([
      ProductOffering.findById(req.body.productOffering.id),
      PriceList.findById(req.body.priceList.id)
    ]);

    if (!productOffering) return res?.status(404).json({ error: 'productOffering not found' });
    if (!productOffering.id) return res?.status(400).json({ error: 'productOffering not synced with ServiceNow' });
    if (!priceList) return res?.status(404).json({ error: 'priceList not found' });
    if (!priceList.sys_id) return res?.status(400).json({ error: 'priceList not synced with ServiceNow' });

    const payload = {
      ...req.body,
      priceList: { id: priceList.sys_id },
      productOffering: { id: productOffering.id }
    };
    

    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.post(
      `${connection.baseURL}/api/sn_tmf_api/catalogmanagement/productOfferingPrice`,
      payload,
      { headers: connection.headers }
    );

    const snData = snResponse.data;
    const mongoPrice = new ProductOfferingPrice({
      sys_id: snData.id,
      name: snData.name,
      price: snData.price,
      lifecycleStatus: snData.lifecycleStatus,
      validFor: snData.validFor,
      productOffering: productOffering._id,
      priceType: snData.priceType,
      recurringChargePeriodType: snData.recurringChargePeriodType,
      unitOfMeasure: snData.unitOfMeasure,
      priceList: priceList._id,
      "@type": "ProductOfferingPrice",
      id: snData.id,
      state: snData.state,
      href: snData.href
    });

    await mongoPrice.save();
    if (res) res.status(201).json({ ...snData, _id: mongoPrice._id.toString(), mongoId: mongoPrice._id.toString() });

  } catch (error) {
    console.error('Error creating product offering price:', error);
    if (!res) return;

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
}



// Original Express route handler for backward compatibility
module.exports = async (req, res) => {
  return createProductOfferingPrice(req, res);
};

// Export the function directly as well
module.exports.createProductOfferingPrice = createProductOfferingPrice;