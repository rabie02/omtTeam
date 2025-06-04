const axios = require('axios');
const OpportunityLine = require('../../models/opportunityLine');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const mongoose = require('mongoose');

async function deleteOpportunityLine(req, res = null){
  try {
    // Get the ID from params or direct parameter
    const lineItemId = req.params?.id || req.id || req;
    // First, verify valid MongoDB ID and find the document to get sys_id
    if (!mongoose.Types.ObjectId.isValid(lineItemId)) {
      return res.status(400).json({ error: "Invalid MongoDB ID format" });
    }

    // Find the document in MongoDB by _id
    const opportunityLineDoc = await OpportunityLine.findById(lineItemId);
    
    if (!opportunityLineDoc) {
      return res.status(404).json({ error: "OpportunityLine not found in MongoDB" });
    }

    // Get the sys_id for ServiceNow deletion
    const sysId = opportunityLineDoc.sys_id;
    
    if (!sysId) {
      return res.status(400).json({ 
        error: "Cannot delete from ServiceNow: sys_id is missing in the MongoDB document" 
      });
    }

    // Delete from ServiceNow using sys_id
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.delete(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity_line_item/${sysId}`,
      { headers: connection.headers } // Note: removed req.body as DELETE requests don't typically have a body
    );
    
    // Delete from MongoDB using _id
    try {
      await OpportunityLine.findByIdAndDelete(lineItemId);
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'delete');
    }
    const succcesResponse = {
      success : true,
      message: "Opportunity Line deleted successfully",
      mongoId: lineItemId,
      serviceNowId: sysId,
      serviceNowResponse: snResponse.data
    }
    // Return success response with both IDs for traceability
    if (res) {
      res.json(succcesResponse);
    }
    return succcesResponse;
  } catch (error) {
    console.error('Error deleting opportunity line:', error);
    const errorResponse = {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      status: error.response?.status || 500
    };
    if (res) {
      res.status(errorResponse.status).json(errorResponse);
    }else{
      throw error;
    }
  }
}

// Original Express route handler for backward compatibility
module.exports = deleteOpportunityLine;
  
  // Export the function for reuse
module.exports.deleteOpportunityLine = deleteOpportunityLine;
