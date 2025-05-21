const axios = require('axios');
const Opportunity = require('../../models/Opportunity');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const mongoose = require('mongoose');

module.exports = async (req, res) => {
  try {
    // First, verify valid MongoDB ID and find the document to get sys_id
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid MongoDB ID format" });
    }

    // Find the document in MongoDB by _id
    const opportunityDoc = await Opportunity.findById(req.params.id);
    
    if (!opportunityDoc) {
      return res.status(404).json({ error: "Opportunity not found in MongoDB" });
    }

    // Get the sys_id for ServiceNow deletion
    const sysId = opportunityDoc.sys_id;
    
    if (!sysId) {
      return res.status(400).json({ 
        error: "Cannot delete from ServiceNow: sys_id is missing in the MongoDB document" 
      });
    }

    // Delete from ServiceNow using sys_id
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.delete(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity/${sysId}`,
      { headers: connection.headers } // Note: removed req.body as DELETE requests don't typically have a body
    );
    
    // Delete from MongoDB using _id
    try {
      await Opportunity.findByIdAndDelete(req.params.id);
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'delete');
    }
    
    // Return success response with both IDs for traceability
    res.json({
      message: "Opportunity deleted successfully",
      mongoId: req.params.id,
      serviceNowId: sysId,
      serviceNowResponse: snResponse.data
    });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};