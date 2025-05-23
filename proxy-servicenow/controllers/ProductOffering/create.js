const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOffering = require('../../models/ProductOffering');
const handleMongoError = require('../../utils/handleMongoError');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');
const ProductSpecification = require ('../../models/productSpecification');

// Create Product Offering 
module.exports = async (req, res) => {
    try {
        let category;
        let prodSpec;
        try {
            category = await ProductOfferingCategory.findById(req.body.category._id);
            prodSpec = await ProductSpecification.findById(req.body.productSpecification._id);
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(400).json({ error: 'Invalid category or product specification ID format' });
            }
            throw error;
        }

        if (!category) {
            return res.status(404).json({ error: 'category not found' });
        }

        if (!category.sys_id) {
            return res.status(400).json({ error: 'category not synced with ServiceNow (missing sys_id)' });
        }
        if (!prodSpec) {
            return res.status(404).json({ error: 'prodSpec not found' });
        }

        if (!prodSpec.sys_id) {
            return res.status(400).json({ error: 'prodSpec not synced with ServiceNow (missing sys_id)' });
        }

        // Authentication and Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });
        
        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) {
            return res.status(401).json({ error: 'Invalid authorization format' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Validation
        const requiredFields = ['name', 'productSpecification', 'productOfferingPrice'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                missing: missingFields
            });
        }

        // Prepare ServiceNow payload
        const snPayload = {
            name: req.body.name,
            version: req.body.version,
            internalVersion: req.body.internalVersion,
            description: req.body.description,
            lastUpdate: "",
            validFor: req.body.validFor,
            productOfferingTerm: req.body.productOfferingTerm,
            productOfferingPrice: req.body.productOfferingPrice,
            productSpecification: {
                id: req.body.productSpecification.id,
                name: req.body.productSpecification.name,
                version: req.body.productSpecification.version,
                internalVersion: 1,
                internalId: req.body.productSpecification.id
            },
            prodSpecCharValueUse: req.body.prodSpecCharValueUse,
            channel: req.body.channel,
            category: {
                id: req.body.category.id,
                name: req.body.category.name
            },
            lifecycleStatus: req.body.lifecycleStatus,
            status: req.body.status
        };

        // ServiceNow API Call
        const snResponse = await axios.post(
            `${process.env.SERVICE_NOW_URL}/api/sn_tmf_api/catalogmanagement/productOffering`,
            snPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${decoded.sn_access_token}`
                }
            }
        );

        // MongoDB Create
        let mongoDoc;
        let populatedDoc;
        try {
            const snRecord = snResponse.data;
            mongoDoc = new ProductOffering({    
                ...snRecord,
                category: req.body.category._id,
                productSpecification: req.body.productSpecification._id
            });
            await mongoDoc.save();
            
            // Populate the created document
            populatedDoc = await ProductOffering.findById(mongoDoc._id)
                .populate('productSpecification')
                .populate('category');
        } catch (mongoError) {
            return handleMongoError(res, snResponse.data, mongoError, 'creation');
        }

        const responseData = {
            result: {
                ...snResponse.data,
                _id: mongoDoc._id,
                // Include the populated fields
                productSpecification: populatedDoc.productSpecification,
                category: populatedDoc.category._id
            },
        };

        res.status(201).json(responseData);

    } catch (error) {
        console.error('Error creating product offering:', error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.error?.message || error.message;
        res.status(status).json({ error: message });
    }
};