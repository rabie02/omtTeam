const config = require('../../../utils/configCreateAccount');

const getConfirmationEmail = (firstName, confirmationLink) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
    <h2 style="color: #3498db; text-align: center;">Confirm Your Registration</h2>
    <p>Hello ${firstName},</p>
    <p>Thank you for registering with ${config.app.name}.</p>
    <p>Please click the button below to complete your registration:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmationLink}"
         style="background-color: #3498db; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 5px; display: inline-block;
                font-size: 16px; font-weight: bold;">
        Confirm Registration
      </a>
    </div>
    <p style="font-size: 12px; color: #777;">This link will expire in 1 hour.</p>
    <p style="font-size: 12px; color: #777;">If you didn't request this registration, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="text-align: center; font-size: 10px; color: #aaa;">&copy; ${new Date().getFullYear()} ${config.app.name}. All rights reserved.</p>
  </div>
`;

const getSuccessHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <title>Registration Complete</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' data:; style-src 'self' 'unsafe-inline';">
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px 20px; background-color: #f4f4f4; color: #333; }
    .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); max-width: 500px; margin: auto; }
    .success { color: #4CAF50; font-size: 28px; margin-bottom: 20px; font-weight: bold; }
    .login-btn {
      background-color: #4CAF50; color: white; padding: 12px 24px;
      text-decoration: none; border-radius: 5px; display: inline-block;
      margin-top: 20px; font-size: 18px;
      transition: background-color 0.3s ease;
    }
    .login-btn:hover {
      background-color: #45a049;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success">✓ Registration Successful</div>
    <p>Your account has been created successfully.</p>
    <p>You can now log in to your account.</p>
    <a href="${config.app.frontendUrl}/login" class="login-btn">Go to Login</a>
  </div>
</body>
</html>
`;

const getErrorHtml = () => `
<!DOCTYPE html>
<html>
<head>
  <title>Registration Error</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' data:; style-src 'self' 'unsafe-inline';">
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px 20px; background-color: #f4f4f4; color: #333; }
    .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); max-width: 500px; margin: auto; }
    .error { color: #f44336; font-size: 28px; margin-bottom: 20px; font-weight: bold; }
    .retry-btn {
      background-color: #f44336; color: white; padding: 12px 24px;
      text-decoration: none; border-radius: 5px; display: inline-block;
      margin-top: 20px; font-size: 18px;
      transition: background-color 0.3s ease;
    }
    .retry-btn:hover {
      background-color: #d32f2f;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error">✗ Registration Failed</div>
    <p>The registration link is invalid or has expired.</p>
    <p>Please try registering again.</p>
    <a href="${config.app.frontendUrl}/register" class="retry-btn">Try Again</a>
  </div>
</body>
</html>
`;
const getWelcomeEmail = (accountName, contacts) => {
  const credentialsList = contacts.map(contact => {
    const username = `${contact.firstName.toLowerCase()}.${contact.lastName.toLowerCase()}`;
    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${contact.firstName} ${contact.lastName}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${contact.email}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${username}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${contact.password}</td>
      </tr>
    `;
  }).join('');

  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
    <h2 style="color: #3498db; text-align: center;">Welcome to ${config.app.name}</h2>
    <p>Hello ${accountName},</p>
    <p>Your account and all associated contacts have been successfully created. Here are the login credentials for your team:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background-color: #3498db; color: white;">
          <th style="padding: 10px; border: 1px solid #ddd;">Contact Name</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Email</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Username</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Password</th>
        </tr>
      </thead>
      <tbody>
        ${credentialsList}
      </tbody>
    </table>
    
    <p style="font-weight: bold; margin-top: 20px;">Please distribute these credentials securely to your team members.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${config.app.frontendUrl}/login"
         style="background-color: #3498db; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 5px; display: inline-block;
                font-size: 16px; font-weight: bold;">
        Access Your Account
      </a>
    </div>
    
    <p style="font-size: 12px; color: #777;">If you didn't request this account, please contact our support team immediately.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="text-align: center; font-size: 10px; color: #aaa;">&copy; ${new Date().getFullYear()} ${config.app.name}. All rights reserved.</p>
  </div>`;
};


module.exports = {
  getConfirmationEmail,
  getSuccessHtml,
  getErrorHtml,
  getWelcomeEmail
};