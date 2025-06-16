const axios = require('axios');
const handleMongoError = require('../../utils/handleMongoError');
const jwt = require('jsonwebtoken');
const Contract = require("../../models/contract");

async function downloadContract(req, res) {
    try {
        const { id } = req.params;
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const contract = await Contract.findById(id);

        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        if (!contract.download_url) {
            return res.status(400).json({ error: 'Download URL not available' });
        }

        // Make the download request with authentication
        const response = await axios.get(
            contract.download_url,
            {
                headers: {
                    'Authorization': `Bearer ${decodedToken.sn_access_token}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'  // Changed to stream
            }
        );

        // Set appropriate headers for the download
        res.setHeader('Content-Disposition', `attachment; filename="${contract.file_name}"`);
        res.setHeader('Content-Type', response.headers['content-type']);
        
        // Pipe the binary stream directly to the response
        response.data.pipe(res);

    } catch (error) {
        console.error('Error downloading contract:', error);

        if (error.name && error.name.includes('Mongo')) {
            const mongoError = handleMongoError(error);
            return res.status(mongoError.status).json({ error: mongoError.message });
        }

        const status = error.response?.status || 500;
        const message = error.response?.data?.error?.message || error.message;
        res.status(status).json({ error: message });
    }
}

module.exports = downloadContract;