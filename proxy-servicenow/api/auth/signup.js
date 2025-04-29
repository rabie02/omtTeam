const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

// In-memory store for pending registrations (use Redis in production)
const pendingRegistrations = new Map();

// Email configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
// Registration request
router.post('/request-registration', async (req, res) => {
  try {
    const { user_name, first_name, last_name, email, mobile_phone, user_password } = req.body;

    // Validate fields
    if (!user_name || !first_name || !last_name || !email || !user_password) {
      return res.status(400).json({ 
        success: false, 
        error: 'missing_fields',
        message: 'All required fields must be provided.'
      });
    }

    // Check if the email already exists in ServiceNow
    const basicAuth = `Basic ${Buffer.from(`${process.env.SERVICE_NOW_USER}:${process.env.SERVICE_NOW_PASSWORD}`).toString('base64')}`;

    const emailExists = await axios.get(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sys_user?sysparm_query=email=${email}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': basicAuth
        },
        timeout: 10000
      }
    );

    if (emailExists.data.result.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'email_exists',
        message: 'This email is already registered.'
      });
    }

    // Check for duplicate pending registration (optional)
    const existingToken = [...pendingRegistrations.entries()].find(([_, data]) => data.userData.email === email);
    if (existingToken) {
      return res.status(409).json({
        success: false,
        error: 'pending_registration_exists',
        message: 'A pending registration already exists. Please check your email.'
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 3600000; // 1 hour

    pendingRegistrations.set(token, { userData: req.body, expiresAt });
    setTimeout(() => pendingRegistrations.delete(token), 3600000);

    const confirmationLink = `${process.env.BACKEND_URL}/api/confirm-registration?token=${token}`;

    await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Confirm Your ${process.env.APP_NAME} Registration`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #2c3e50;">Confirm Your Email</h2>
          <p>Hello ${first_name},</p>
          <p>Please click the button below to confirm your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BACKEND_URL}/api/confirm-registration?token=${token}" 
               style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Confirm Email
            </a>
          </div>
          <p>If you didn't request this registration, please ignore this email.</p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'Confirmation email sent. Please check your inbox.'
    });

  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({
      success: false,
      error: 'internal_server_error',
      message: 'An unexpected error occurred during registration.'
    });
  }
});


// Email confirmation and user creation
router.get('/confirm-registration', async (req, res) => {
  const { token } = req.query;
  const successHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Confirmed</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 500px; margin: 0 auto; }
        .success { color: green; font-size: 24px; margin-bottom: 20px; }
        .error { color: red; font-size: 24px; margin-bottom: 20px; }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          background: #3498db;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✓ Email confirmed successfully!</div>
        <p>Your account has been activated. You can now log in.</p>
        <a href="${process.env.FRONTEND_URL}/login" class="btn">Go to Login</a>
      </div>
    </body>
    </html>
  `;

  const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Confirmation Error</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 500px; margin: 0 auto; }
        .error { color: red; font-size: 24px; margin-bottom: 20px; }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          background: #3498db;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error">✗ Confirmation Failed</div>
        <p>There was a problem confirming your email.</p>
        <a href="${process.env.FRONTEND_URL}/login" class="btn">Go to Login</a>
      </div>
    </body>
    </html>
  `;

  try {
    if (!token) {
      return res.status(400).send(errorHtml);
    }

    const registration = pendingRegistrations.get(token);
    if (!registration) {
      return res.status(400).send(errorHtml);
    }

    if (Date.now() > registration.expiresAt) {
      pendingRegistrations.delete(token);
      return res.status(400).send(errorHtml);
    }

    // ServiceNow API Call
    const basicAuth = `Basic ${Buffer.from(`${process.env.SERVICE_NOW_USER}:${process.env.SERVICE_NOW_PASSWORD}`).toString('base64')}`;
    const user = registration.userData;

    await axios.post(
      `${process.env.SERVICE_NOW_URL}/api/now/table/sys_user?sysparm_input_display_value=true`,
      {
        user_name: user.user_name,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        mobile_phone: user.mobile_phone,
        user_password: user.user_password,
        roles: 'self_service'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': basicAuth
        }
      }
    );

    pendingRegistrations.delete(token);
    return res.send(successHtml);
    
  } catch (error) {
    console.error('Confirmation error:', error);
    return res.status(500).send(errorHtml);
  }
});


module.exports = router;