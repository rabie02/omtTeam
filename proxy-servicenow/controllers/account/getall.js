const axios = require('axios');
const Account = require('../../models/account');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    // First, try to get accounts from MongoDB with populated contacts and locations
    const accounts = await Account.find({})
      .populate({
        path: 'contacts',
        select: 'firstName lastName email phone jobTitle isPrimaryContact active sys_id'
      })
      .populate({
        path: 'locations',
        select: 'name city state country street zip latitude longitude sys_id'
      })
      .lean(); // Convert to plain JS objects for better performance

    // If accounts exist in MongoDB, return them with populated data
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