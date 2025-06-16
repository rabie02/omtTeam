const Account = require('../../models/account');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    let mongoQuery = {};

    // If there's a search query, filter by name or other fields
    if (searchQuery) {
      mongoQuery.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } } // Add fields as needed
      ];
    }

    // Search in MongoDB
    const accounts = await Account.find(mongoQuery)
      .populate({
        path: 'contacts',
        select: 'firstName lastName email phone jobTitle isPrimaryContact active sys_id'
      })
      .populate({
        path: 'locations',
        select: 'name city state country street zip latitude longitude sys_id'
      })
      .lean(); // Better performance

    if (accounts && accounts.length > 0) {
      return res.json({
        result: accounts,
        total: accounts.length,
        source: 'mongodb'
      });
    }

    console.log('No accounts found in MongoDB');
    return res.json([]);

  } catch (error) {
    console.error('Error fetching accounts:', error);
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ error: mongoError.message });
  }
};
