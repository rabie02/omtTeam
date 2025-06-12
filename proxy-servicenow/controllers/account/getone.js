const Account = require('../../models/account');
const { isValidObjectId } = require('mongoose');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid ID format',
        message: 'Please provide a valid MongoDB ObjectID'
      });
    }

    // Find account in MongoDB with populated data
    const account = await Account.findById(id)
      .populate({
        path: 'contacts',
        select: 'firstName lastName email phone jobTitle isPrimaryContact active sys_id',
        options: { sort: { isPrimaryContact: -1, lastName: 1 } } // Primary contacts first
      })
      .populate({
        path: 'locations',
        select: 'name city state country street zip latitude longitude sys_id',
        options: { sort: { name: 1 } } // Sort locations alphabetically
      })
      .lean(); // Convert to plain JavaScript object

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
        message: `No account found with ID ${id} in MongoDB`
      });
    }

    return res.json({
      success: true,
      data: account
    });

  } catch (error) {
    console.error('Error in getAccountById:', error);
    
    // Handle MongoDB-specific errors
    if (error.name === 'CastError' || error.name.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ 
        success: false,
        error: mongoError.message,
        details: mongoError.details 
      });
    }
    
    // Handle other unexpected errors
    return res.status(500).json({ 
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};