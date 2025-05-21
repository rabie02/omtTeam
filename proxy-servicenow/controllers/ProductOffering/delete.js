const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOffering = require('../../models/ProductOffering');
const handleMongoError = require('../../utils/handleMongoError');


module.exports = async (req, res) => {
  try {
          const token = req.headers.authorization.split(' ')[1];
          const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
          const { id } = req.params;
  
          // Find the productOffering by MongoDB _id to get ServiceNow sys_id
          let productOffering;
          try {
              productOffering = await ProductOffering.findById(id);
          } catch (error) {
              if (error.name === 'CastError') {
                  return res.status(400).json({ error: 'Invalid productOffering ID format' });
              }
              throw error;
          }
  
          if (!productOffering) {
              return res.status(404).json({ error: 'productOffering not found' });
          }
  
          if (!productOffering.id) {
              return res.status(400).json({ error: 'productOffering not synced with ServiceNow (missing sys_id)' });
          }
  
          const sys_id = productOffering.id;
  
  
          const snResponse = await axios.delete(
              `${process.env.SERVICE_NOW_URL}/api/sn_tmf_api/catalogmanagement/productOffering/${sys_id}`,
              {
                  headers: { 'Authorization': `Bearer ${decodedToken.sn_access_token}` },
                  params: { sysparm_suppress_auto_sys_field: true }
              }
          );
  
          try {
              await ProductOffering.findByIdAndDelete(id);
          } catch (mongoError) {
              return handleMongoError(res, snResponse.data, mongoError, 'deletion');
          }
  
          res.status(204).end();
      } catch (error) {
          if (axios.isAxiosError(error)) {
              const status = error.response?.status || 500;
              return res.status(status).json({
                  error: status === 404 ? 'Not found' : 'ServiceNow delete failed',
                  details: error.response?.data || error.message
              });
          }
          res.status(500).json({ error: 'Server error', details: error.message });
      }
};