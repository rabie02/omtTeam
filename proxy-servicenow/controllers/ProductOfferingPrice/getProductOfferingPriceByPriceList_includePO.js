const handleMongoError = require('../../utils/handleMongoError');
const productOfferingPrice = require('../../models/productOfferingPrice');
const mongoose = require('mongoose');

async function getProductOfferingPriceByPriceList(req, res = null) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ObjectId provided');
    }
    const priceListObjectId = new mongoose.Types.ObjectId(id);

    const product_offering_prices= await productOfferingPrice.find({
        priceList: priceListObjectId
      }).populate('productOffering', 'name').lean();
      
    const jsonBody = {
      result: product_offering_prices,
      total: product_offering_prices.length,
      source : "mongodb"
    };
      return res ?  res.json(jsonBody) : jsonBody;
    

  } catch (error) {
    console.error('Error fetching product off List:', error);
    const mongoError = handleMongoError(error);
    res.status(mongoError.status).json({ error: mongoError.message });
  }
};



// Original Express route handler for backward compatibility
module.exports = async (req, res) => {
  return getProductOfferingPriceByPriceList(req, res);
};

// Export the function directly as well
module.exports.getProductOfferingPriceByPriceList = getProductOfferingPriceByPriceList;