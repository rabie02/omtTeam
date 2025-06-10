const handleMongoError = require('../../utils/handleMongoError');
const productOfferingPrice = require('../../models/productOfferingPrice');


module.exports = async (req, res) => {
  try {

    const product_offering_prices= await productOfferingPrice.find({}).populate('productOffering');
   
      return res.json({
        result: product_offering_prices,
        total: product_offering_prices.length,
        source : "mongodb"
      });
    

  } catch (error) {
    console.error('Error fetching product off List:', error);
    const mongoError = handleMongoError(error);
    res.status(mongoError.status).json({ error: mongoError.message });
  }
};