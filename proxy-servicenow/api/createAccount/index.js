const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const {
  validateRegistrationInput
} = require('../../controllers/createAccount/validation');
const {
  getAddressFromCoordinates
} = require('../../controllers/createAccount/geocodingService');
const {
    pendingRegistrations,
    emailToTokenMap,
    generateToken,
    sendConfirmationEmail,
    hasPendingRegistration,
    storeRegistration,
    sendWelcomeEmail,
  } = require('../../controllers/createAccount/registrationService');
const {
  checkEmailExists,
  createServiceNowRecords
} = require('../../controllers/createAccount/serviceNowClient');
const {
  getSuccessHtml,
  getErrorHtml,
  getWelcomeEmail
} = require('../../controllers/createAccount/emailTemplates');
const config = require('../../controllers/createAccount/config');

// Reverse geocode endpoint
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const addressDetails = await getAddressFromCoordinates(parseFloat(lat), parseFloat(lng));
    res.json(addressDetails);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ 
      address: '', 
      city: '', 
      state: '', 
      country: '', 
      postalCode: '',
      error: 'Failed to process geocoding request' 
    });
  }
});

// Registration request endpoint
router.post('/request-creation', async (req, res) => {
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
  
      // Check if email already has a pending registration
      if (hasPendingRegistration(sanitizedData.email)) {
        console.log(`Email ${sanitizedData.email} already has a pending registration`);
        return res.status(200).json({
          success: true,
          message: 'A confirmation email has already been sent. Please check your inbox.',
          email: sanitizedData.email
        });
      }
  
      // Check if email exists in ServiceNow
      try {
        if (!config.serviceNow.url || !config.serviceNow.user || !config.serviceNow.password) {
          console.error("ServiceNow environment variables are not fully set.");
          return res.status(500).json({
            success: false,
            error: 'servicenow_config_missing',
            message: 'Server configuration error. Cannot check email availability.'
          });
        }
  
        const emailExists = await checkEmailExists(sanitizedData.email);
        if (emailExists) {
          console.warn(`Email ${sanitizedData.email} already exists`);
          return res.status(409).json({
            success: false,
            error: 'email_exists',
            message: 'This email is already registered.'
          });
        }
      } catch (snError) {
        console.error('ServiceNow email check error:', snError.message);
        return res.status(500).json({
          success: false,
          error: 'servicenow_check_failed',
          message: 'Could not verify email existence. Please try again later.'
        });
      }
  
      // Hash password
      const hashedPassword = sanitizedData.password;
      const registrationData = {
        ...sanitizedData,
        password: hashedPassword
      };
  
      // Generate and store token
      const token = generateToken();
      storeRegistration(token, registrationData);
  
      // Send confirmation email
      try {
        await sendConfirmationEmail(
          registrationData.email,
          registrationData.first_name,
          token
        );
        console.log(`Confirmation email sent to ${registrationData.email}`);
      } catch (mailError) {
        console.error('Email sending error:', mailError.message);
        // Clean up if email failed
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
  });

// Update the /confirm-creation endpoint in your router
router.get('/confirm-creation', async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) return res.status(400).send(getErrorHtml());
  
      const registration = pendingRegistrations.get(token);
      if (!registration || Date.now() > registration.expiresAt) {
        if (registration) pendingRegistrations.delete(token);
        return res.status(400).send(getErrorHtml());
      }
  
      const user = registration.userData;
  
      // Create ServiceNow records
      const { serviceNowRecords, mongoUser } = await createServiceNowRecords(user);
          
      // Cleanup
      pendingRegistrations.delete(token);
      emailToTokenMap.delete(user.email);
      
      // Send welcome email with credentials
      try {
        await sendWelcomeEmail(
            user.email,
            user.first_name,
            user.last_name,
            user.password
          );
        console.log(`Welcome email sent to ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
      
      return res.send(getSuccessHtml());
  
    } catch (error) {
      console.error('Confirmation error:', error);
      return res.status(500).send(getErrorHtml());
    }
  });


module.exports = router;