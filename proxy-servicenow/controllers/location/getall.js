const axios = require('axios');
const Location = require('../../models/location');
const Account = require('../../models/account');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    let mongoQuery = {};

    // If there's a search query, filter by relevant fields
    if (searchQuery) {
      mongoQuery.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { city: { $regex: searchQuery, $options: 'i' } },
        { state: { $regex: searchQuery, $options: 'i' } },
        { country: { $regex: searchQuery, $options: 'i' } },
        { street: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Search in MongoDB with account and contact population
    const locations = await Location.find(mongoQuery)
      .populate({
        path: 'account',
        select: 'name email phone status sys_id'
      })
      .populate({
        path: 'contact',
        select: 'firstName lastName email phone jobTitle isPrimaryContact active sys_id'
      })
      .lean();

    if (locations && locations.length > 0) {
      return res.json({
        result: locations,
        total: locations.length,
        source: 'mongodb'
      });
    }
    return res.json([]);

  } catch (error) {
    console.error('Error fetching locations:', error);
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ error: mongoError.message });
  }
};