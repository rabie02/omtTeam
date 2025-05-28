const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const OpportunityLine = require('../../models/opportunityLine');
const PriceList = require('../../models/priceList');

module.exports = async (req, res) => {
  try {
    const { id } = req.params; // MongoDB _id
    const updateData = req.body;

    // 1. Get existing opportunity line
    const opportunityLine = await OpportunityLine.findById(id);
    if (!opportunityLine) {
      return res.status(404).json({ error: 'Opportunity line not found' });
    }

    // 2. Handle price_list if provided
    if (updateData.price_list) {
      const priceList = await PriceList.findById(updateData.price_list);
      if (!priceList) {
        return res.status(404).json({ error: 'Price list not found' });
      }
      updateData.price_list = priceList.sys_id; // Convert to ServiceNow sys_id
    }

    // 3. Update in ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.patch(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity_line_item/${opportunityLine.sys_id}`,
      updateData,
      { headers: connection.headers }
    );

    // 4. Update in MongoDB
    const updatedLine = await OpportunityLine.findByIdAndUpdate(
      id,
      {
        ...updateData,
        sys_updated_on: snResponse.data.result.sys_updated_on,
        sys_mod_count: snResponse.data.result.sys_mod_count
      },
      { new: true }
    );

    // 5. Return the updated data
    res.json({
      serviceNow: snResponse.data.result,
      mongoDB: updatedLine
    });

  } catch (error) {
    console.error('Update error:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};