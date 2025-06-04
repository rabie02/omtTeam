const handleMongoError = require('../../utils/handleMongoError');
const getOpportunityWithDetails = require('./getOpportuntityWithdetails');

const getOneOpportunity = async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid opportunity ID format'
        });
      }
  
      const opportunity = await getOpportunityWithDetails(id);
  
      return res.json({
        success: true,
        data: opportunity
      });
      
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ 
        success: false,
        error: mongoError.message 
      });
    }
  };
  
  module.exports = getOneOpportunity;