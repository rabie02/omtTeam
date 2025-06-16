const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const config = require('../../../utils/configCreateAccount');
const { getWelcomeEmail, getConfirmationEmail } = require('./emailTemplates');

// In-memory store with email tracking
const pendingRegistrations = new Map();
const emailToTokenMap = new Map();

const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
});

const sendWelcomeEmail = async (accountEmail, accountName, contacts) => {
  try {
    const mailOptions = {
      from: `"${config.app.name}" <${config.email.user}>`,
      to: accountEmail,
      subject: `Welcome to ${config.app.name} - Team Credentials`,
      html: getWelcomeEmail(accountName, contacts)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

const generateToken = () => crypto.randomBytes(32).toString('hex');

const sendConfirmationEmail = async (email, firstName, token) => {
  const confirmationLink = `${config.app.backendUrl}/api/confirm-creation?token=${token}`;
  
  return transporter.sendMail({
    from: `"${config.app.name}" <${config.email.user}>`,
    to: email,
    subject: `Confirm Your ${config.app.name} Registration`,
    html: getConfirmationEmail(firstName, confirmationLink)
  });
};

// Check if email already has a pending registration
const hasPendingRegistration = (email) => {
  const token = emailToTokenMap.get(email);
  if (!token) return false;
  
  const registration = pendingRegistrations.get(token);
  if (!registration) {
    emailToTokenMap.delete(email);
    return false;
  }
  
  // Check if token is still valid (not expired)
  const isExpired = Date.now() > registration.expiresAt;
  if (isExpired) {
    pendingRegistrations.delete(token);
    emailToTokenMap.delete(email);
    return false;
  }
  
  return true;
};

// Store registration data and track email
const storeRegistration = (token, registrationData) => {
  const expiresAt = Date.now() + config.registration.tokenExpiry;
  
  pendingRegistrations.set(token, {
    userData: registrationData,
    expiresAt
  });
  
  emailToTokenMap.set(registrationData.email, token);
  
  // Set automatic cleanup
  setTimeout(() => {
    if (pendingRegistrations.has(token)) {
      pendingRegistrations.delete(token);
      emailToTokenMap.delete(registrationData.email);
      console.log(`Cleaned up expired token: ${token}`);
    }
  }, config.registration.tokenExpiry + 5000);
};

module.exports = {
  pendingRegistrations,
  emailToTokenMap,
  generateToken,
  sendConfirmationEmail,
  sendWelcomeEmail, // MUST be included here
  hasPendingRegistration,
  storeRegistration
};

const checkEmailExists = async (email) => {
  // Check both MongoDB and ServiceNow
  const [mongoUser, serviceNowResults] = await Promise.all([
    User.findOne({ email }),
    serviceNowRequest('GET', `/api/now/table/customer_contact?sysparm_query=email=${encodeURIComponent(email)}`)
  ]);

  return mongoUser || serviceNowResults.length > 0;
};