const axios = require('axios');
const Location = require('../../models/location');
const Account = require('../../models/account');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const page = parseInt(req.query.page) || 1;  // Default: Page 1
    const limit = parseInt(req.query.limit) || 10; // Default: 10 per page
    const skip = (page - 1) * limit; // Calculate documents to skip

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

    // Get total count of matching documents (for pagination)
    const total = await Location.countDocuments(mongoQuery);

    // Search in MongoDB with pagination and population
    const locations = await Location.find(mongoQuery)
      .skip(skip)  // Skip documents for pagination
      .limit(limit) // Limit results per page
      .populate({
        path: 'account',
        select: 'name email phone status sys_id'
      })
      .populate({
        path: 'contact',
        select: 'firstName lastName email phone jobTitle isPrimaryContact active sys_id'
      })
      .lean();

    return res.json({
      result: locations || [], // Return empty array if no results
      total, // Total number of matching documents
      page,  // Current page
      limit, // Items per page
      source: 'mongodb'
    });

  } catch (error) {
    console.error('Error fetching locations:', error);
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ error: mongoError.message });
  }
};