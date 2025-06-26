const { pendingRegistrations, emailToTokenMap } = require('./registrationService');
const Account = require('../../../models/account');
const { sendWelcomeEmail } = require('./registrationService');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../../../utils/configCreateAccount');
const { getErrorHtml, getSuccessHtml } = require('./emailTemplates');

const confirmCreation = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send(getErrorHtml('Missing confirmation token'));

    // Retrieve registration data from memory store
    const registration = pendingRegistrations.get(token);
    if (!registration || Date.now() > registration.expiresAt) {
      if (registration) pendingRegistrations.delete(token);
      return res.status(400).send(getErrorHtml('Invalid or expired token'));
    }

    const { userData } = registration;
    let accountId;
    let accountSysId;

    // Use either system token or ServiceNow credentials
    const authConfig = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (process.env.SYSTEM_API_TOKEN) {
      authConfig.headers.Authorization = `Bearer ${process.env.SYSTEM_API_TOKEN}`;
    } else if (config.serviceNow.user && config.serviceNow.password) {
      authConfig.auth = {
        username: config.serviceNow.user,
        password: config.serviceNow.password
      };
    } else {
      throw new Error('Authentication not configured - missing SYSTEM_API_TOKEN and ServiceNow credentials');
    }

    // Step 1: Handle account creation/update
    if (userData.token) {
      try {
        const decoded = jwt.verify(userData.token.replace('Bearer ', ''), process.env.JWT_SECRET);
        accountSysId = decoded.id;
        
        const account = await Account.findOne({ sys_id: accountSysId });
        if (!account) throw new Error('Account not found in MongoDB');
        accountId = account._id;

        await axios.patch(
          `${config.app.backendUrl}/api/account/${accountId}`,
          {
            name: userData.name,
            phone: userData.mobile_phone,
            email: userData.email,
            status: 'active'
          },
          authConfig
        );

      } catch (err) {
        console.error("Account update failed:", err);
        throw new Error("Account update failed: " + err.message);
      }
    } else {
      const accountPayload = {
        name: userData.name,
        email: userData.email,
        phone: userData.mobile_phone,
        status: 'active',
      };

      const newAccount = await Account.create(accountPayload);
      accountId = newAccount._id;
      accountSysId = newAccount.sys_id;
    }

    // Arrays to store created contact and location IDs
    const contactIds = [];
    const locationIds = [];
    const contactsCredentials = [];

    // Process each contact and their location
    for (const [index, contactData] of userData.contacts.entries()) {
      try {
        const username = `${contactData.firstName.toLowerCase()}.${contactData.lastName.toLowerCase()}`;
        
        contactsCredentials.push({
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          email: contactData.email,
          username,
          password: contactData.password
        });

        // Create contact
        const contactResponse = await axios.post(
          `${config.app.backendUrl}/api/contact`,
          {
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            email: contactData.email,
            phone: contactData.phone,
            account: accountId,
            isPrimaryContact: index === 0,
            active: true,
            password: contactData.password
          },
          authConfig
        );
        if (index === 0) {
          primaryContactSysId = contactResponse.data.servicenow.sys_id;
          
          // Update ServiceNow account with primary contact
          await axios.patch(
            `${config.serviceNow.url}/api/now/table/customer_account/${accountSysId}`,
            {
              primary_contact: primaryContactSysId
            },
            authConfig
          );
        }

        // Create location for this contact
        const locationResponse = await axios.post(
          `${config.app.backendUrl}/api/location`,
          {
            name: `${contactData.firstName} ${contactData.lastName} Location`,
            latitude: contactData.location?.latitude?.toString(),
            longitude: contactData.location?.longitude?.toString(),
            street: contactData.location?.address || '',
            city: contactData.location?.city || '',
            state: contactData.location?.state || '',
            country: contactData.location?.country || '',
            zip: contactData.location?.postalCode || '',
            account: accountId,
            contact: contactResponse.data._id
          },
          authConfig
        );

        // Update contact with location reference
        await axios.patch(
          `${config.app.backendUrl}/api/contact/${contactResponse.data._id}`,
          {
            location: locationResponse.data._id
          },
          authConfig
        );

        contactIds.push(contactResponse.data._id);
        locationIds.push(locationResponse.data._id);

      } catch (contactError) {
        console.error(`Error processing contact ${index}:`, contactError);
        throw new Error(`Failed to process contact ${contactData.email}: ${contactError.message}`);
      }
    }

    // Update account with all contacts and locations
    await axios.patch(
      `${config.app.backendUrl}/api/account/${accountId}`,
      {
        $push: {
          contacts: { $each: contactIds },
          locations: { $each: locationIds }
        }
      },
      authConfig
    );

    // Send single welcome email to account with all contacts' credentials
   try {
      if (contactsCredentials.length > 0) {
        await sendWelcomeEmail(
          userData.email,
          userData.name,
          contactsCredentials
        );
      }
    } catch (emailError) {
      console.error('Email sending failed (non-critical):', emailError);
      // Continue with registration even if email fails
    }
    // Clean up the pending registration
    pendingRegistrations.delete(token);
    emailToTokenMap.delete(userData.email);

    return res.status(200).send(getSuccessHtml());

  } catch (error) {
    console.error('Confirmation error:', error);
    return res.status(500).send(getErrorHtml(error.message));
  }
};

module.exports = confirmCreation;