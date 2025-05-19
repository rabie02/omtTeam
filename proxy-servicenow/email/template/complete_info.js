require('dotenv').config();

const template = (link) => `
<!DOCTYPE html>
<html>
<head>
  <title>Complete Your Account Information</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' data:; style-src 'self' 'unsafe-inline';">
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 50px 20px; background-color: #f4f4f4; color: #333; }
    .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); max-width: 500px; margin: auto; }
    .reminder { color: #2196F3; font-size: 28px; margin-bottom: 20px; font-weight: bold; }
    .action-btn {
      background-color: #2196F3; color: white; padding: 12px 24px;
      text-decoration: none; border-radius: 5px; display: inline-block;
      margin-top: 20px; font-size: 18px; color: white;
      transition: background-color 0.3s ease;
    }
    .action-btn:hover {
      background-color: #1976D2;
    }
    .note { font-size: 14px; color: #666; margin-top: 25px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="reminder"> Complete Your Account</div>
    <p>Thank you for starting your registration! To activate your account, we need you to complete your contact information.</p>
    <p>Please take a moment to fill in your:</p>
    <ul style="list-style: none; padding: 0; margin: 20px 0;">
      <li>• Contact phone number</li>
      <li>• Shipping address</li>
      <li>• ...</li>
    </ul>
    <a href="${link}" class="action-btn">Complete Your Account</a>
    <p class="note">This information helps us ensure account security and provide better service.</p>
  </div>
</body>
</html>
`;





module.exports = {
  template 
  };