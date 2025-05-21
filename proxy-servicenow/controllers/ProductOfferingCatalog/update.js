const axios = require('axios');
const jwt = require('jsonwebtoken');
const ProductOfferingCatalog = require('../../models/ProductOfferingCatalog');
const handleMongoError = require('../../utils/handleMongoError');
const getone = require('./getone')

module.exports = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const { id } = req.params;


        // Find the catalog by MongoDB _id to get ServiceNow sys_id
        let catalog;
        try {
            catalog = await ProductOfferingCatalog.findById(id);
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(400).json({ error: 'Invalid catalog ID format' });
            }
            throw error;
        }

        if (!catalog) {
            return res.status(404).json({ error: 'Catalog not found' });
        }

        if (!catalog.sys_id) {
            return res.status(400).json({ error: 'Catalog not synced with ServiceNow (missing sys_id)' });
        }

        const sys_id = catalog.sys_id;


        const allowedFields = [
            'end_date', 'image', 'thumbnail', 'description', 'external_id',
            'is_default', 'external_source', 'status', 'name', 'hierarchy_json', 'leaf_categories'
        ];

        const updateBody = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateBody[field] = req.body[field] === "" ? null : req.body[field];
            }
        });

        const snResponse = await axios.patch(
            `${process.env.SERVICE_NOW_URL}/api/now/table/sn_prd_pm_product_offering_catalog/${sys_id}`,
            updateBody,
            {
                headers: {
                    'Authorization': `Bearer ${decodedToken.sn_access_token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        let mongoDoc;
        try {
            mongoDoc = await ProductOfferingCatalog.findByIdAndUpdate(
                id,
                { $set: snResponse.data.result },
                { runValidators: true }
            );
        } catch (mongoError) {
            return handleMongoError(res, snResponse.data, mongoError, 'update');
        }

        const result = await getone(mongoDoc._id)
        const responseData = {
            result
        };
        res.status(201).json(responseData);
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