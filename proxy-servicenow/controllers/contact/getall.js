const axios = require('axios');
const Contact = require('../../models/Contact');
const Account = require('../../models/account');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    const searchQuery = req.query.q;
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

    // Search in MongoDB with account population
    const contacts = await Contact.find(mongoQuery)
      .populate({
        path: 'account',
        select: 'name email phone status sys_id'
      })
      .populate({
        path: 'location',
        select: 'name city state country street zip latitude longitude sys_id'
      })
      .lean();

    if (contacts && contacts.length > 0) {
      return res.json({
        result: contacts,
        total: contacts.length,
        source: 'mongodb'
      });
    }
    return res.json([]);

  } catch (error) {
    console.error('Error fetching contacts:', error);
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ error: mongoError.message });
  }
};