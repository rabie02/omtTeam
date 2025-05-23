const axios = require('axios');
const snConnection = require('../../utils/servicenowConnection');
const handleMongoError = require('../../utils/handleMongoError');
const productOfferingPrice = require('../../models/productOfferingPrice');


module.exports = async (req, res) => {
  try {
    const mongoId = req.params.id; // MongoDB _id

    // First, find the product in MongoDB to get the ServiceNow sys_id
    const product = await productOfferingPrice.findById(mongoId);

    if (!product) {
      return res.status(404).json({ error: "product not found in db" });

    }

    const servicenowId = product.sys_id;

    await productOfferingPrice.findOneAndDelete(mongoId);
    console.log(`Product deleted from MongoDB: ${mongoId}`);

    if (servicenowId) {
      try {
        const connection = snConnection.getConnection(req.user.sn_access_token);
        const snResponse = await axios.delete(
          `${connection.baseURL}/api/sn_tmf_api/catalogmanagement/productOfferingPrice/${req.params.id}`,
          req.body,
          { headers: connection.headers }
        );
        console.log(`Product deleted from ServiceNow: ${servicenowId}`);
        
        res.json({
          message: 'Product successfully deleted from both MongoDB and ServiceNow',
          mongoId: mongoId,
          servicenowId: servicenowId,
          servicenowResponse: snResponse.data
        });

      } catch (snError) {
        console.error('ServiceNow deletion failed:', snError);
        res.status(207).json({ // 207 Multi-Status
          message: 'Product deleted from MongoDB but ServiceNow deletion failed',
          mongoId: mongoId,
          servicenowId: servicenowId,
          error: snError.response?.data?.error?.message || snError.message
        });

      }

    } else{
      res.json({
        message : "product success deleted from mongo but no id servicenow ",
        mongoId: mongoId,
      })
    }



  } catch (error) {
    console.error('Error deleting product offering price :', error);
    // Handle MongoDB errors
    if (error.name && error.name.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }
    
    // Handle other errors
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    res.status(status).json({ error: message });
  }
  
};