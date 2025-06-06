const axios = require('axios');
const handleMongoError = require('../../../utils/handleMongoError');
const snConnection = require('../../../utils/servicenowConnection');
const mongoose = require('mongoose');
const Contract = require("../../../models/contract");

const getLatestQuoteByOpportunity = require('../../Quote/getLatestQuoteByOpportunity');

async function generateContract(req, res) {
  try {
    const op_id = req.params.id;

    const quote = await getLatestQuoteByOpportunity(req);
    if(!quote) {return res.status(404).json({ error: 'Quote not found, you must generate a quote!' });  }

    const opObjectId = new mongoose.Types.ObjectId(op_id);
    
    const exists = await Contract.findOne({
      opportunity: opObjectId,
      quote: quote._id
    }).lean();

    if(exists) { return res.status(200).json(exists) }
    // Step 3: Create in ServiceNow
    const connection = snConnection.getConnection(req.user.sn_access_token);
    const snResponse = await axios.get(
        `${connection.baseURL}/api/sn_prd_pm/quote?sys_id=${quote.sys_id}`,
        { headers: connection.headers }
    );

    const result = snResponse.data.result;
    const contractBody = {
        opportunity: op_id,
          quote: quote._id.toString(),
          file_name: result.file_name,
          download_url: result.download_url,
    }
    

    const contract = new Contract(contractBody);
    const response = await contract.save();

    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Error generating contract:', error);
    
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

module.exports = generateContract;