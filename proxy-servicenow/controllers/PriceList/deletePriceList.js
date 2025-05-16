const axios = require('axios');
const priceList = require('../../models/priceList');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    // Delete from ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.delete(
      `${connection.baseURL}/api/now/table/sn_csm_pricing_price_list/${req.params.id}`,
      { headers: connection.headers }  // Removed req.body from here
    );
    
    // Delete from MongoDB
    try {
      const deletedDoc = await priceList.findOneAndDelete(
        { sys_id: req.params.id }  
      );

      if (!deletedDoc) {
        return res.status(404).json({
          error: "Document not found in MongoDB",
          serviceNowSuccess: snResponse.data
        });
      }
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'delete');
    }
    
    res.json({
      message: "Price list deleted successfully",
      serviceNowResponse: snResponse.data
    });
  } catch (error) {
    console.error('Error deleting price list:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};