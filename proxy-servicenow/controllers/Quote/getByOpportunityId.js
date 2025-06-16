const handleMongoError = require('../../utils/handleMongoError');
const Quote = require('../../models/quote');
const mongoose = require('mongoose');

async function getLatestOneByOpportunity(req, res = null) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid ObjectId provided');
    }
    const OpportunityObjectId = new mongoose.Types.ObjectId(id);

    const result = await Quote.find({
        opportunity: OpportunityObjectId,
        state:'Approved'
      }).sort({ createdAt: -1 })
      .limit(1)
      .lean();

    if(res){  
        res.status(200).json({
            result
        });
    }
    return result[0];
    

  } catch (error) {
    console.error('Error fetching product off List:', error);
    const mongoError = handleMongoError(error);
    res.status(mongoError.status).json({ error: mongoError.message });
  }
};



// Original Express route handler for backward compatibility
module.exports = async (req, res) => {
  return getLatestOneByOpportunity(req, res);
};

// Export the function directly as well
module.exports.getLatestOneByOpportunity = getLatestOneByOpportunity;