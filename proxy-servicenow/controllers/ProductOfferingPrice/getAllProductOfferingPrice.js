const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const productOfferingPrice = require('../../models/productOfferingPrice');


module.exports = async (req, res) => {
  try {

    const product_offering_prices= await productOfferingPrice.find({})
    if (product_offering_prices.length > 0) {
      return res.json({
        result: product_offering_prices,
        total: product_offering_prices.length,
        source : "mongodb"
      });
    }
    console.log('No products found in MongoDB, fetching from ServiceNow...');

    const connection = snConnection.getConnection(req.user.sn_access_token);
    
    const snResponse = await axios.get(
      `${connection.baseURL}/api/sn_tmf_api/catalogmanagement/productOfferingPrice`,
      { headers: connection.headers }
    );

    res.json({
      ...snResponse.data,
      source: "servicenow source "
    })

  } catch (error) {
    console.error('Error fetching product off List:', error);
    const mongoError = handleMongoError(error);
    res.status(mongoError.status).json({ error: mongoError.message });
  }
};