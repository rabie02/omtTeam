const axios = require('axios');
require('dotenv').config();

const verifyAccountToken = async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }

  try {
    // 1. Verify token in ServiceNow (check if it exists AND is unused)
    const query = `u_token=${token}^u_used=false`;
    const servicenowResp = await axios.get(`${process.env.SERVICE_NOW_URL}/api/now/table/u_opportunity_tokens`, {
      params: {
        sysparm_query: query,
        sysparm_limit: 1
      },
      auth: {
        username: process.env.SERVICE_NOW_USER,
        password: process.env.SERVICE_NOW_PASSWORD
      },
      headers: { Accept: 'application/json' }
    });

    const tokenRecord = servicenowResp.data.result?.[0];
    if (!tokenRecord) {
      return res.status(400).json({ success: false, message: 'Token is invalid or already used' });
    }

    // 2. Mark token as used
    await axios.patch(`${process.env.SERVICE_NOW_URL}/api/now/table/u_opportunity_tokens/${tokenRecord.sys_id}`, {
      u_used: true
    }, {
      auth: {
        username: process.env.SERVICE_NOW_USER,
        password: process.env.SERVICE_NOW_PASSWORD
      },
      headers: { 'Content-Type': 'application/json' }
    });

    // 3. Continue to MongoDB check (optional)
    // const account = await Account.findOne({ sys_id: tokenRecord.u_account_id }); // if you store it

    return res.status(200).json({
      success: true,
      tokenUsed: true,
      sys_id: tokenRecord.sys_id
    });

  } catch (err) {
    console.error('❌ Error verifying token in ServiceNow:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = verifyAccountToken;
