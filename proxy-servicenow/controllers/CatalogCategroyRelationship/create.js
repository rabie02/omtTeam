const axios = require('axios');
const jwt = require('jsonwebtoken');
const CatalogCategoryRelationship = require('../../models/CatalogCategoryRelationship');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res)=>{
  
    try{
      
      const authHeader = req.headers.authorization;
      const [bearer, token] = authHeader.split(' ');
      if (bearer !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Invalid authorization format' });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
      // Validate allowed fields
      const allowedFields = ['category', 'catalog'];
      
      const updates = Object.keys(req.body);
      const isValidOperation = updates.every(update => allowedFields.includes(update));
  
      if (!isValidOperation) {
        return res.status(400).json({ error: 'Only two fields allowed: sys_id & status!' });
      }
      const CCrelationship = {
        source: req.body.catalog,
        target: req.body.category
      }

     
  
      const snResponse = await axios.post(
        `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_catalog_category_relationship`,
        CCrelationship,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${decoded.sn_access_token}`
          }
        }
      );

      
      let mongoDoc;
      try {
        mongoDoc = new CatalogCategoryRelationship(snResponse.data.result);
        await mongoDoc.save();
      } catch (mongoError) {
        return handleMongoError(res, snResponse.data, mongoError, 'creation');
      }
  

  
      res.json(snResponse.data.result);
      
    } catch (error) {
      console.error('Error update product offering category \'s state: ', error);
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      res.status(status).json({ error: message });
    }
  }