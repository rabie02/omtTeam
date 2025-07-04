const axios = require('axios');
const Contact = require('../../models/Contact');
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
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { phone: { $regex: searchQuery, $options: 'i' } },
        { jobTitle: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Get total count of matching documents (for pagination)
    const total = await Contact.countDocuments(mongoQuery);

    // Search in MongoDB with pagination and population
    const contacts = await Contact.find(mongoQuery)
      .skip(skip)  // Skip documents for pagination
      .limit(limit) // Limit results per page
      .populate({
        path: 'account',
        select: 'name email phone status sys_id'
      })
      .populate({
        path: 'location',
        select: 'name city state country street zip latitude longitude sys_id'
      })
      .lean();

    return res.json({
      result: contacts || [], // Return empty array if no results
      total, // Total number of matching documents
      page,  // Current page
      limit, // Items per page
      source: 'mongodb'
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ error: mongoError.message });
  }
};