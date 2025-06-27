const axios = require('axios');
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const Quote = require('../../models/quote');
const Account = require('../../models/account');
const Opportunity = require('../../models/opportunity');
const PriceList = require('../../models/priceList');
const handleMongoError = require('../../utils/handleMongoError');
const createquoteline = require('../QuoteLine/create');
const getOpportuntityWithdetails = require('../Opportunity/getOpportuntityWithdetails');

module.exports = async (req, res) => {
  try {


    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const id = req.params.id;  

    if (!id) {
      return res.status(400).json({ error: 'Opportunity ID is required' });
    }

    // Find opportunity using _id
    const localOpportunity = await Opportunity.findById(id);

    if (!localOpportunity) {
      return res.status(404).json({ error: `Opportunity not found with _id: ${id}` });
    }

    const snResponse = await axios.post(
      `${process.env.SERVICE_NOW_URL}/api/sn_quote_mgmt_core/bismilah`,
      { opty_sys_id: localOpportunity.sys_id },
      {
        headers: {
          'Authorization': `Bearer ${decodedToken.sn_access_token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const serviceNowData = snResponse.data.result.quote;

    // Fetch Account, Opportunity, and PriceList references
    const [account, opportunity, priceList] = await Promise.all([
      Account.findOne({ sys_id: serviceNowData.account }),
      Opportunity.findOne({ sys_id: serviceNowData.opportunity }),
      PriceList.findOne({ sys_id: serviceNowData.price_list }) // Fetch PriceList
    ]);

    if (!account) {
      return res.status(404).json({ error: `Account not found with sys_id: ${serviceNowData.account}` });
    }

    if (!opportunity) {
      return res.status(404).json({ error: `Opportunity not found with sys_id: ${serviceNowData.opportunity}` });
    }

    if (!priceList) {
      return res.status(404).json({ error: `PriceList not found with sys_id: ${serviceNowData.price_list}` });
    }

    // Create Quote using the static create method
    const mongoDoc = await Quote.create({
      ...serviceNowData,
      opportunity: opportunity._id,
      price_list: priceList._id,
      account: account._id,
      subscription_start_date: dayjs().toISOString(),
      subscription_end_date: dayjs().add(opportunity.term_month, 'month').toISOString()
    });

    try {
      await createquoteline(
        snResponse.data.result.line_items,
        mongoDoc
      );
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to create Quote Line',
        details: error.message
      });
    }
    const opp = getOpportunityWithDetails(opportunity._id);
    res.status(201).json({
      message: `Quote ${serviceNowData.number} and its line items have been created successfully.`,
      data: opp
    });

  } catch (error) {
    if (axios.isAxiosError(error)) {
      return res.status(error.response?.status || 500).json({
        error: 'ServiceNow integration failed',
        details: error.response?.data || error.message
      });
    }

    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return handleMongoError(error, res);
    }

    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};
