const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOffering = require('../../models/ProductOffering');
const handleMongoError = require('../../utils/handleMongoError');
const catMongo = require('../../models/ProductOfferingCategory');

// Update Product Offering 
module.exports = async (req, res) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            const { id } = req.params;
    
            const catmongoID = req.body.category;
            const specMongoID = req.body.productSpecification;
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
    
    
            const allowedFields = [
              'name', 'displayName', 'description', 'lifecycleStatus',
              'productOfferingTerm', 'validFor', 'productOfferingPrice',
               'channel', 'category', 'status', 'productSpecification'
            ];
    
            const updateBody = {};
            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updateBody[field] = req.body[field] === "" ? null : req.body[field];
                }
            });
            
            const snResponse = await axios.patch(
                `${process.env.SERVICE_NOW_URL}/api/sn_tmf_api/catalogmanagement/productOffering/${sys_id}`,
                updateBody,
                {
                    headers: {
                        'Authorization': `Bearer ${decodedToken.sn_access_token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            let mongoResponse;
    
            try {
                
                const mongoPayload = {
                    "category": [
                        catmongoID
                    ],
                    "name": snResponse.data.name,
                    "description": snResponse.data.description,
                    "lifecycleStatus":  snResponse.data.lifecycleStatus,
                    "productOfferingTerm":  snResponse.data.productOfferingTerm,
                    "validFor":  snResponse.data.validFor,
                    "productOfferingPrice":  snResponse.data.productOfferingPrice,
                    "prodSpecCharValueUse":  snResponse.data.prodSpecCharValueUse,
                    "channel":  snResponse.data.channel,
                    "status":  snResponse.data.status,
                    "productSpecification":  specMongoID,
                    "href":  snResponse.data.href
                    }
                
                await ProductOffering.findByIdAndUpdate(
                    id,
                    { $set: mongoPayload },
                    { runValidators: true }
                );
                mongoResponse = await ProductOffering.findById(id).populate('productSpecification');
            } catch (mongoError) {
                return handleMongoError(res, snResponse.data, mongoError, 'update');
            }
            
            res.json(mongoResponse);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status || 500;
                return res.status(status).json({
                    error: status === 404 ? 'Not found' : 'ServiceNow update failed',
                    details: error.response?.data || error.message
                });
            }
            res.status(500).json({ error: 'Server error', details: error.message });
        }
};
