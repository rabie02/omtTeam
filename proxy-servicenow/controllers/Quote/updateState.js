const axios = require('axios');
const jwt = require('jsonwebtoken');
const Quote = require('../../models/quote'); 
const handleMongoError = require('../../utils/handleMongoError');
const getoneQuote = require('./getone'); 

module.exports = async (req, res) => {
    try {
        // Authorization handling
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Invalid authorization format' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.sn_access_token) {
            return res.status(401).json({ error: 'Missing ServiceNow access token in JWT' });
        }

        const { id } = req.params;

        // Validate request body fields - expand as needed
        const allowedFields = ['state'];
        const receivedFields = Object.keys(req.body);
        const invalidFields = receivedFields.filter(field => !allowedFields.includes(field));
        
        if (invalidFields.length > 0) {
            return res.status(400).json({ 
                error: `Invalid fields provided: ${invalidFields.join(', ')}`,
                allowedFields
            });
        }

        // Quote validation
        let quote;
        try {
            quote = await Quote.findById(id);
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(400).json({ error: 'Invalid quote ID format' });
            }
            throw error;
        }

        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        if (!quote.sys_id) {
            return res.status(400).json({ 
                error: 'Quote not synced with ServiceNow (missing sys_id)',
                solution: 'Please sync the quote before updating'
            });
        }

        // Prepare update body for ServiceNow
        const updateBody = { sys_id: quote.sys_id };
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateBody[field] = req.body[field];
            }
        });

        // ServiceNow update - using table API endpoint
        const snResponse = await axios.patch(
            `${process.env.SERVICE_NOW_URL}/api/sn_quote_mgmt_core/bismilah`,
            updateBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${decoded.sn_access_token}`,
                    'Accept': 'application/json'
                }
            }
        );

        // Handle ServiceNow response
        const snData = snResponse.data.result;
        if (!snData || snData.sys_id !== quote.sys_id) {
            return res.status(500).json({
                error: 'ServiceNow update succeeded but returned invalid data',
                details: snResponse.data
            });
        }

        // Prepare MongoDB update
        const updateData = {};
        allowedFields.forEach(field => {
            if (snData[field]) {
                updateData[field] = snData[field].value || snData[field];
            }
        });

        // MongoDB update
        let mongoDoc;
        try {
            mongoDoc = await Quote.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );
        } catch (mongoError) {
            return handleMongoError(res, snData, mongoError, 'update');
        }

        // Final response
        const result = await getoneQuote(mongoDoc._id);
        res.status(201).json({ result });

    } catch (error) {
        console.error('Error updating quote:', error);

        // Axios error handling
        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            const errorData = error.response?.data?.error || error.response?.data || {};
            
            return res.status(status).json({
                error: errorData.message || 'ServiceNow update failed',
                details: errorData.detail || error.message,
                serviceNowDetails: errorData
            });
        }

        // JWT error handling
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Other errors
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
};
