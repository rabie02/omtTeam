const Contact = require('../../models/Contact');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    const accountId = req.params.id; // The account ID to search contacts for

    // Find all contacts where account field matches the given accountId
    const contacts = await Contact.find({ account: accountId }).lean();

    if (contacts.length > 0) {
      return res.json({
        success: true,
        count: contacts.length,
        data: contacts
      });
    }

    return res.status(404).json({
      success: false,
      message: 'No contacts found for this account',
      accountId: accountId
    });

  } catch (error) {
    console.error('Error fetching contacts by account ID:', error);
    
    // Handle invalid MongoDB ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid account ID format',
        accountId: req.params.id
      });
    }
    
    // Handle MongoDB errors
    if (error.name && error.name.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ 
        success: false,
        error: mongoError.message 
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
};