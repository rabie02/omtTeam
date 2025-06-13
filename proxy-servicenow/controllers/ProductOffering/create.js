const axios = require('axios');
const ProductOffering = require('../../models/ProductOffering');
const handleMongoError = require('../../utils/handleMongoError');
const ProductOfferingCategory = require('../../models/ProductOfferingCategory');
const ProductSpecification = require ('../../models/productSpecification');
const snConnection = require('../../utils/servicenowConnection');
const externalIdHelper = require('../../utils/externalIdHelper');

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

        
        //initialize servicenow connection
        const connection = snConnection.getConnection(req.user.sn_access_token);

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
                id: prodSpec.sys_id,
            },
            //prodSpecCharValueUse: req.body.prodSpecCharValueUse,
            channel: req.body.channel,
            category: {
                id: req.body.category.id,
                name: req.body.category.name
            },
            lifecycleStatus: req.body.lifecycleStatus,
            status: req.body.status
        };

        console.log(JSON.stringify(snPayload,null,2))
        

        // ServiceNow API Call
        const snResponse = await axios.post(
            `${connection.baseURL}/api/sn_tmf_api/catalogmanagement/productOffering`,
            snPayload,
            { headers: connection.headers }
        );

        // MongoDB Create
        let mongoDoc;
        let populatedDoc;
        try {
            const snRecord = snResponse.data;
            mongoDoc = new ProductOffering({    
                ...snRecord,
                category: req.body.category._id,
                productSpecification: req.body.productSpecification._id,
                sys_id: snRecord.id
            });
            await mongoDoc.save();

            console.log(JSON.stringify(mongoDoc,null,2))
            
            //patch external_id(mongoDB id) to serviceNow
            await externalIdHelper(connection,`api/now/table/sn_prd_pm_product_offering/${snRecord.id}`, mongoDoc._id.toString());

            // Populate the created document
            populatedDoc = await ProductOffering.findById(mongoDoc._id)
                .populate('productSpecification')
                .populate('category');
        } catch (mongoError) {
            return handleMongoError(res, snResponse.data, mongoError, 'creation');
        }

        const responseData = {
            result: populatedDoc,
        };

        res.status(201).json(responseData);

    } catch (error) {
        console.error('Error creating product offering:', error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.error?.message || error.message;
        res.status(status).json({ error: message });
    }
};