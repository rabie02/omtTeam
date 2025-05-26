const axios = require('axios');
const Opportunity = require('../../models/Opportunity');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

async function updateOpportunity(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find opportunity in MongoDB
    const opportunity = await Opportunity.findById(id);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Update in ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.patch(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity/${opportunity.sys_id}`,
      updateData,
      { headers: connection.headers }
    );

    // Update in MongoDB
    const updatedOpportunity = await Opportunity.findByIdAndUpdate(
      id,
      { ...snResponse.data.result },
      { new: true }
    ).populate('account', 'name email country city industry')
      .populate('price_list', 'name');

    res.json({
      message: 'Opportunity updated successfully',
      data: updatedOpportunity
    });

  } catch (error) {
    console.error('Error updating opportunity:', error);
    // Handle MongoDB errors
    if (error.name && error.name.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }

    // Handle ServiceNow errors
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
}

module.exports = async (req, res) => {
  return updateOpportunity(req, res);
};

module.exports.updateOpportunity = updateOpportunity;