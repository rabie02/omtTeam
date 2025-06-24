
const Account = require('../../models/account');
const handleMongoError = require('../../utils/handleMongoError');
module.exports = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let mongoQuery = {};

    if (searchQuery) {
      mongoQuery.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await Account.countDocuments(mongoQuery);

    // Search with pagination
    const accounts = await Account.find(mongoQuery)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'contacts',
        select: 'firstName lastName email phone jobTitle isPrimaryContact active sys_id'
      })
      .populate({
        path: 'locations',
        select: 'name city state country street zip latitude longitude sys_id'
      })
      .lean();

    return res.json({
      result: accounts,
      total,
      page,
      limit,
      source: 'mongodb'
    });

  } catch (error) {
    console.error('Error fetching accounts:', error);
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ error: mongoError.message });
  }
};