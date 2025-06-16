const axios = require('axios');
const Stage = require('../../../models/stage');
const handleMongoError = require('../../../utils/handleMongoError');
const Opportunity = require('../../../models/opportunity');
const snConnection = require('../../../utils/servicenowConnection');
const getOpportunityWithDetails = require('../getOpportuntityWithdetails');

async function updateStage(req, res) {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    // Validate stage exists
    const stageDoc = await Stage.findById(stage);
    if (!stageDoc) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    // Find opportunity
    const opportunity = await Opportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Update ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    await axios.patch(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity/${opportunity.sys_id}`,
      { stage: stageDoc.sys_id },
      { headers: connection.headers }
    );

    // Update MongoDB
    opportunity.stage = stage;
    const updatedOpportunity = await opportunity.save();
    const dataOpportunity = await getOpportunityWithDetails(updatedOpportunity._id);

    return res.json({
      message: 'Stage updated successfully',
      data: dataOpportunity
    });
    
  } catch (error) {
    console.error('Stage update error:', error);
    
    if (error.name?.includes('Mongo')) {
      const { status, message } = handleMongoError(error);
      return res.status(status).json({ error: message });
    }
    
    res.status(500).json({ 
      error: error.response?.data?.error?.message || error.message 
    });
  }
}

module.exports = updateStage;