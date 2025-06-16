const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const handleMongoError = require('../../utils/handleMongoError');
const Contract = require("../../models/contract");
const getoneQuote = require('../Quote/getone');

async function generateContract(req, res) {
  try {

    const id = new mongoose.Types.ObjectId(req.params.id);
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Check for existing contract
    const exists = await Contract.findOne({ quote: id }).lean();
    if (exists) return res.status(200).json(exists);

    // Fetch quote
    const quote = await getoneQuote(id);
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }
    if (!quote.sys_id) {
      return res.status(400).json({ error: "Quote missing ServiceNow ID" });
    }


    // Fetch ServiceNow data
    const snResponse = await axios.get(
      `${process.env.SERVICE_NOW_URL}/api/sn_prd_pm/quote?sys_id=${quote.sys_id}`,
      {
        headers: {
          'Authorization': `Bearer ${decodedToken.sn_access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Handle ServiceNow response format
    let result = snResponse.data.result;
    if (Array.isArray(result)) {
      if (result.length === 0) {
        throw new Error('ServiceNow returned no quote record');
      }
      result = result[0]; // Use first record if array
    }

    // Validate required fields
    if (!result.file_name || !result.download_url) {
      throw new Error('Invalid ServiceNow response: Missing contract data');
    }

    // Create contract
    const contract = new Contract({
      opportunity: quote.opportunity?._id,
      quote: quote._id,  // Keep as ObjectId
      file_name: result.file_name,
      download_url: result.download_url,
    });

    const response = await contract.save();
    return res.status(201).json(response);

  } catch (error) {
    console.error('Error generating contract:', error);

    // Handle MongoDB errors
    if (error.name?.includes('Mongo')) {
      const mongoError = handleMongoError(error);
      return res.status(mongoError.status).json({ error: mongoError.message });
    }

    // Handle Axios errors
    if (error.isAxiosError) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message;
      return res.status(status).json({ error: message });
    }

    // Handle generic errors
    res.status(400).json({ error: error.message });
  }
}

module.exports = generateContract;