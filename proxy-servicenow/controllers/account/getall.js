const Account = require('../../models/account');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    // First, try to get accounts from MongoDB
    const accounts = await Account.find({});
    // If accounts exist in MongoDB, return them
    if (accounts && accounts.length > 0) {
      return res.json({
        result: accounts,
        total: accounts.length,
        source: 'mongodb'
      });
    }

    // If no accounts in MongoDB, fetch from ServiceNow
    console.log('No accounts found in MongoDB');
    return res.json([]);

  } catch (error) {
    console.error('Error fetching accounts:', error);
    // Handle MongoDB errors
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ error: mongoError.message });
  }
};