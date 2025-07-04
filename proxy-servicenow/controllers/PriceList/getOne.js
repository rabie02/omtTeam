const priceList = require("../../models/priceList");
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

        const data = await priceList.findById(id);

        if (!data) return res.status(404).send({ message: 'Price List not found' });
        res.send(data);
    } catch (error) {
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