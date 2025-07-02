const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

module.exports = async (req, res) => {
    console.log("Received token request");

    try {
        // 1. Extract and decode the token
        const token = req.query.token;
        if (!token) {
            return res.status(400).json({ error: 'Missing token' });
        }

        const decoded = Buffer.from(token, 'base64').toString('utf-8'); // "accountId:email:guid"
        const [accountId, accountEmail, tokenGuid] = decoded.split(':');

        if (!accountId || !accountEmail || !tokenGuid) {
            return res.status(400).json({ error: 'Invalid token format' });
        }

        // 2. Query ServiceNow to verify token is unused
        const SERVICE_NOW_URL = 'https://your-instance.service-now.com';
        const table = 'u_opportunity_tokens';
        const query = `u_tokenLIKE${tokenGuid}^u_account=${accountId}^u_used=false`;

        const tokenResp = await axios.get(`${SERVICE_NOW_URL}/api/now/table/${table}`, {
            params: {
                sysparm_query: query,
                sysparm_limit: 1
            },
            auth: {
                username: process.env.SN_USER,
                password: process.env.SN_PASS
            },
            headers: { 'Accept': 'application/json' }
        });

        const tokenRecord = tokenResp.data.result[0];

        if (!tokenRecord) {
            return res.status(400).json({ error: 'Invalid or already used token' });
        }

        // 3. Mark token as used
        await axios.patch(`${SERVICE_NOW_URL}/api/now/table/${table}/${tokenRecord.sys_id}`, {
            u_used: true
        }, {
            auth: {
                username: process.env.SERVICE_NOW_USER,
                password: process.env.SERVICE_NOW_PASSWORD
            },
            headers: { 'Content-Type': 'application/json' }
        });

        // 4. Send email to decoded email from token
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"OMT Bot" <${process.env.EMAIL_USER}>`,
            to: accountEmail,
            subject: 'Your One-Time Token Was Used',
            text: `Hello,\n\nYour one-time token has been successfully validated and marked as used for account ID:\n${accountId}\n\nThank you,\nOMT APP`
        };

        await transporter.sendMail(mailOptions);

        // 5. Respond with success
        return res.status(200).json({
            message: 'Token accepted, marked as used, and confirmation email sent.',
            sent_to: accountEmail
        });

    } catch (error) {
        console.error('Error in token handler:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.message
        });
    }
};
