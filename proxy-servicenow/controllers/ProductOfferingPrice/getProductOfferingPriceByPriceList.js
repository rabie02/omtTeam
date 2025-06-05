const handleMongoError = require('../../utils/handleMongoError');
const productOfferingPrice = require('../../models/productOfferingPrice');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ObjectId provided');
    }
    const priceListObjectId = new mongoose.Types.ObjectId(id);

    const product_offering_prices= await productOfferingPrice.find({
        priceList: priceListObjectId
      }).lean();
   
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