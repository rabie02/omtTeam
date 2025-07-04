const axios = require('axios');
const nodemailer = require('nodemailer');
const { template } = require('../../email/template/complete_info');
require('dotenv').config();

module.exports = async (req, res) => {
  console.log("📩 Received token request");

  try {
    const { to, token } = req.body;

    if (!token || !to) {
      return res.status(400).json({ error: 'Missing required fields (to, token)' });
    }

    // 1. Verify token in ServiceNow
    const table = 'u_opportunity_tokens';
    const query = `u_token=${token}^u_used=false`;

    const tokenResp = await axios.get(`${process.env.SERVICE_NOW_URL}/api/now/table/${table}`, {
      params: {
        sysparm_query: query,
        sysparm_limit: 1
      },
      auth: {
        username: process.env.SERVICE_NOW_USER,
        password: process.env.SERVICE_NOW_PASSWORD
      },
      headers: { 'Accept': 'application/json' }
    });

    const tokenRecord = tokenResp.data.result[0];
    if (!tokenRecord) {
      return res.status(400).json({ error: 'Invalid or already used token' });
    }

    // 2. Compose token URL
    const tokenUrl = `${process.env.FRONTEND_URL}/createAccount?token=${token}`;

    // 3. Send email with template
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"OMT Bot" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Complete Your Account Information',
      html: template(tokenUrl) // ✅ Use your imported template here
    };

    await transporter.sendMail(mailOptions);

    // 4. Success
    return res.status(200).json({
      message: 'Token is valid. Email sent with link.',
      sent_to: to
    });

  } catch (error) {
    console.error('❌ Error in token handler:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
};
