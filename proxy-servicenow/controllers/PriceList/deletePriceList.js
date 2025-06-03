const axios = require('axios');
const PriceList = require('../../models/priceList');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const mongoose = require('mongoose');

async function deletePriceList (req, res = null){
  try {
    // Extract ID from either req.params.id or req.id
    const priceListId = req.params?.id || req.id;
    
    if (!priceListId) {
      const error = "Price list ID is required";
      if (res) {
        return res.status(400).json({ error });
      }
      throw new Error(error);
    }

    // First, find the document in MongoDB to get the sys_id
    let priceListDoc;
    try {
      // Check if the ID is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid MongoDB ID format" });
      }
      
      priceListDoc = await PriceList.findById(req.params.id);
      
      if (!priceListDoc) {
        return res.status(404).json({ error: "Price list not found in MongoDB" });
      }
    } catch (mongoError) {
      return handleMongoError(res, null, mongoError, 'find');
    }

    // Get the sys_id from the MongoDB document for ServiceNow deletion
    const sysId = priceListDoc.sys_id;
    
    if (!sysId) {
      return res.status(400).json({ 
        error: "Cannot delete from ServiceNow: sys_id is missing in the MongoDB document" 
      });
    }

    // Delete from ServiceNow using the sys_id
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.delete(
      `${connection.baseURL}/api/now/table/sn_csm_pricing_price_list/${sysId}`,
      { headers: connection.headers }
    );
    
    // Delete from MongoDB using MongoDB's _id
    try {
      const deletedDoc = await PriceList.findByIdAndDelete(req.params.id);
      // Note: We already verified the document exists above, so this should always succeed
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'delete');
    }
    
    res.json({
      message: "Price list deleted successfully",
      mongoId: req.params.id,
      serviceNowId: sysId,
      serviceNowResponse: snResponse.data
    });
  } catch (error) {
    console.error('Error deleting price list:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
}
// Original Express route handler for backward compatibility
module.exports = async (req, res) => {
  return deletePriceList(req, res);
};

// Export the function for reuse
module.exports.deletePriceList = deletePriceList;