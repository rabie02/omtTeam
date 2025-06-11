// controllers/account/requestCreation.js

const {
  validateRegistrationInput
} = require('./validationAccountCreation');
const {
  pendingRegistrations,
  emailToTokenMap,
  generateToken,
  sendConfirmationEmail,
  hasPendingRegistration,
  storeRegistration
} = require('./registrationService');
const config = require('../../../utils/configCreateAccount');

const requestCreation = async (req, res) => {
  try {
    console.log("Received registration request.");

    const { isValid, errors, sanitizedData } = validateRegistrationInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'validation_failed',
        message: 'Validation failed',
        fields: errors
      });
    }

    if (hasPendingRegistration(sanitizedData.email)) {
      console.log(`Email ${sanitizedData.email} already has a pending registration`);
      return res.status(200).json({
        success: true,
        message: 'A confirmation email has already been sent. Please check your inbox.',
        email: sanitizedData.email
      });
    }

    if (!config.serviceNow.url || !config.serviceNow.user || !config.serviceNow.password) {
      console.error("ServiceNow environment variables are not fully set.");
      return res.status(500).json({
        success: false,
        error: 'servicenow_config_missing',
        message: 'Server configuration error. Cannot check email availability.'
      });
    }

    // Hashing password - assuming it's already hashed in validation step
    const hashedPassword = sanitizedData.password;
    const registrationData = {
      ...sanitizedData,
      password: hashedPassword
    };

    const token = generateToken();
    storeRegistration(token, registrationData);

    try {
      await sendConfirmationEmail(
        registrationData.email,
        registrationData.first_name,
        token
      );
      console.log(`Confirmation email sent to ${registrationData.email}`);
    } catch (mailError) {
      console.error('Email sending error:', mailError.message);
      pendingRegistrations.delete(token);
      emailToTokenMap.delete(registrationData.email);
      return res.status(500).json({
        success: false,
        error: 'email_send_failed',
        message: 'Could not send confirmation email. Please verify your email address and try again.',
        details: mailError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Confirmation email sent. Please check your inbox to complete your registration.',
      email: registrationData.email
    });

  } catch (error) {
    console.error('Registration request unexpected error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'An unexpected error occurred during registration. Please try again later.'
    });
  }
};

module.exports = requestCreation;
