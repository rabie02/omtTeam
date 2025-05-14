const axios = require('axios');
const Opportunity = require('../../models/Opportunity');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
  try {
    // Utiliser le token d'authentification de l'utilisateur
    const connection = snConnection.getConnection(req.user.sn_access_token);
    
    // Récupérer les données de ServiceNow
    const snResponse = await axios.get(
      `${connection.baseURL}/api/now/table/sn_opty_mgmt_core_opportunity`,
      { headers: connection.headers }
    );
    
    // Synchroniser avec MongoDB
    // try {
    //   // Mise à jour ou insertion des données dans MongoDB
    //   const opportunities = snResponse.data.result;
    //   for (const opp of opportunities) {
    //     await Opportunity.findOneAndUpdate(
    //       { sys_id: opp.sys_id },
    //       opp,
    //       { upsert: true, new: true }
    //     );
    //   }
    // } catch (mongoError) {
    //   return handleMongoError(res, snResponse.data, mongoError, 'synchronization');
    // }
    
    res.json(snResponse.data.result);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};