const { pendingRegistrations, emailToTokenMap } = require('./registrationService');
const Account = require('../../../models/account');
const { sendWelcomeEmail } = require('./registrationService');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../../../utils/configCreateAccount');
const {getErrorHtml, getSuccessHtml} = require('./emailTemplates');

const confirmCreation = async (req, res) => {
  try {
    
    const { token } = req.query;
    if (!token) return res.status(400).send(getErrorHtml());


    // Retrieve registration data from memory store
    const registration = pendingRegistrations.get(token);
    if (!registration || Date.now() > registration.expiresAt) {
        if (registration) pendingRegistrations.delete(token);
        return res.status(400).send(getErrorHtml());
      }

    const { userData } = registration;
    let accountId;
    let accountSysId;

    // Step 1: Handle account creation/update
    if (userData.token) {
      // Existing account update flow
      try {
        const decoded = jwt.verify(userData.token, process.env.JWT_SECRET);
        accountSysId = decoded.id; // ServiceNow sys_id from token
        console.log(accountSysId);
        
        // Find account in MongoDB by sys_id to get MongoDB _id
        const account = await Account.findOne({ sys_id: accountSysId });
        if (!account) {
          throw new Error('Account not found in MongoDB');
        }
        accountId = account._id;

        // Prepare account update payload
        const accountUpdatePayload = {
          name: userData.type === 'company' ? userData.company_name : `${userData.first_name} ${userData.last_name}`,
          phone: userData.mobile_phone || '',
          email: userData.email,
          status: 'active',
          ...(userData.location && {
            city: userData.location.city,
            state: userData.location.state,
            country: userData.location.country,
            zip: userData.location.postalCode,
            latitude: userData.location.latitude?.toString(),
            longitude: userData.location.longitude?.toString()
          })
        };

        // Call the PATCH /account/:id endpoint using MongoDB _id
        await axios.patch(
          `${config.app.backendUrl}/api/account/${accountId}`,
          accountUpdatePayload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer system` // Use system token or appropriate auth
            }
          }
        );

      } catch (err) {
        console.error("Account update failed:", err);
        throw new Error("Account update failed: " + err.message);
      }
    } else {
      // New account creation
      const accountPayload = {
        name: userData.type === 'company' ? userData.company_name : `${userData.first_name} ${userData.last_name}`,
        email: userData.email,
        phone: userData.mobile_phone || '',
        status: 'active',
        ...(userData.location && {
          city: userData.location.city,
          state: userData.location.state,
          country: userData.location.country,
          zip: userData.location.postalCode,
          latitude: userData.location.latitude?.toString(),
          longitude: userData.location.longitude?.toString()
        }),
        ...(userData.type === 'company' && {
          industry: userData.industry || '',
          website: userData.website || ''
        })
      };

      // Create account in MongoDB (which will trigger ServiceNow creation)
      const newAccount = await Account.create(accountPayload);
      accountId = newAccount._id;
      accountSysId = newAccount.sys_id;
    }

    // Step 2: Create location by calling POST /location endpoint
    const locationResponse = await axios.post(
      `${config.app.backendUrl}/api/location`,
      {
        name: `${userData.first_name} ${userData.last_name} Location`,
        latitude: userData.location?.latitude?.toString(),
        longitude: userData.location?.longitude?.toString(),
        street: userData.location?.address || '',
        city: userData.location?.city || '',
        state: userData.location?.state || '',
        country: userData.location?.country || '',
        zip: userData.location?.postalCode || '',
        account: accountId // Using MongoDB _id
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer system`
        }
      }
    );

    // Step 3: Create contact by calling POST /contact endpoint
    const contactResponse = await axios.post(
      `${config.app.backendUrl}/api/contact`,
      {
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        phone: userData.mobile_phone || '',
        account: accountId, // Using MongoDB _id
        isPrimaryContact: true,
        active: true,
        ...(userData.type === 'company' && { jobTitle: userData.job_title || 'Representative' })
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer system`
        }
      }
    );

    // Clean up the pending registration
    pendingRegistrations.delete(token);
    emailToTokenMap.delete(userData.email);

    // Send welcome email
    await sendWelcomeEmail(
      userData.email,
      userData.first_name,
      userData.last_name,
      userData.password
    );

    return res.status(200).send(getSuccessHtml());

  } catch (error) {
    console.error('Confirmation error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'confirmation_failed',
      message: 'Account confirmation failed',
      details: error.message
    });
  }
};

module.exports = confirmCreation;