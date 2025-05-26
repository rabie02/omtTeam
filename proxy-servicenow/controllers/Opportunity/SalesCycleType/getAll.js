const SalesCycleType = require('../../../models/salesCycleType');
const handleMongoError = require('../../../utils/handleMongoError');

// Create Product Offering 
module.exports = async (req, res) => {
    try {
      
      const mongoData = await SalesCycleType.find({}).lean();
      // Forward successful response
      res.status(201).json(mongoData);
  
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }
}