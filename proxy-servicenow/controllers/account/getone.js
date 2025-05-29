const axios = require('axios');
const Account = require('../../models/account');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    const mongoId = req.params.id; // MongoDB _id
    
    // Try to find account in MongoDB first
    const account = await Account.findById(mongoId).lean();
    
    if (account) {
      return res.json({
        result: account,
        source: 'mongodb'
      });
    }
    
    // This would require a different approach since we don't have sys_id
    return res.status(404).json({ 
      error: 'Account not found in MongoDB',
      mongoId: mongoId
    });
    
  } catch (error) {
    console.error('Error fetching account by ID:', error);
    
    // Handle invalid MongoDB ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid MongoDB ID format',
        mongoId: req.params.id
      });
    }
    
    // Handle MongoDB errors
    if (error.name && error.name.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }
    
    // Handle other errors
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};