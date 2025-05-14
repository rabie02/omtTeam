const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const ProductOfferingPrice = require('../../models/ProductOfferingPrice');

module.exports = async (req, res) => {
  try {
    // Utiliser le token d'authentification de l'utilisateur
    const connection = snConnection.getConnection(req.user.sn_access_token);
    
    // Récupérer les données de ServiceNow
    const snResponse = await axios.get(
      `${connection.baseURL}/api/sn_tmf_api/catalogmanagement/productOfferingPrice`,
      { headers: connection.headers }
    );
    
    // Synchroniser avec MongoDB
    try {
      // Mise à jour ou insertion des données dans MongoDB
      const productoffList = snResponse.data.result;
      for (const opp of productoffList) {
        await ProductOfferingPrice.findOneAndUpdate(
          { sys_id: opp.sys_id },
          opp,
          { upsert: true, new: true }
        );
      }
    } catch (mongoError) {
      return handleMongoError(res, snResponse.data, mongoError, 'synchronization');
    }
    
    res.json(snResponse.data);
  } catch (error) {
    console.error('Error fetching product off List:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
};