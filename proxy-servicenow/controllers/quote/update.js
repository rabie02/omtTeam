const axios = require('axios');
const Quote = require('../../models/quote');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (req, res) => {
    try {
        const data = req.body;
        const id = data.sys_id;

        // Validate required fields
        if (!id) {
            return res.status(400).json({ error: 'sys_id is required' });
        }

        try {
            const result = await Quote.findOneAndUpdate(
                { sys_id: id },
                { $set: data },
                { upsert: true, new: true, rawResult: true }
            );

            // Proper upsert detection
            const wasCreated = !!result.lastErrorObject?.upserted ||
                result.lastErrorObject?.updatedExisting === false;

            res.status(200).json({
                message: wasCreated ? 'Quote created successfully' : 'Quote updated successfully'
            });

        } catch (mongoError) {
            return handleMongoError(res, data, mongoError, 'update');
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            return res.status(status).json({
                error: status === 404 ? 'Not found' : 'ServiceNow operation failed',
                details: error.response?.data || error.message
            });
        }
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};