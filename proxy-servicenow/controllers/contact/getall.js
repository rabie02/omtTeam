const Contact = require('../../models/Contact');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    // First, try to get contact from MongoDB with populated contacts and locations
    const contact = await Contact.find({})
    .populate('account', 'name email country city industry')
    .lean(); 

    // If contact exist in MongoDB, return them with populated data
    if (contact && contact.length > 0) {
      return res.json({
        result: contact,
        total: contact.length,
        source: 'mongodb'
      });
    }

    // If no contact in MongoDB, fetch from ServiceNow
    console.log('No contact found in MongoDB');
    return res.json([]);

  } catch (error) {
    console.error('Error fetching contact:', error);
    // Handle MongoDB errors
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ error: mongoError.message });


  }
};