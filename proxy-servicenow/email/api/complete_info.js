const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const complete_info = require('../template/complete_info')
require('dotenv').config();

// Email transporter (Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Route 1: Generate token and send email
const sendVerificationToken = async (req, res) => {
  try {
    const { id, account } = req.body;


    if (!account) {
      return res.status(400).json({ error: 'Email is required in the request body' });
    }

    const token = jwt.sign(
      { id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    const verificationLink = `${process.env.FRONTEND_URL}/createAccount/?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: account,
      subject: 'Complet infomation of your account',
      html: complete_info.template(verificationLink) ,
    });

    res.status(200).json({ message: 'Token sent to email!' });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to send token' });
  }
};

// Route 2: Verify token
const verifyToken = (req, res) => {
  try {
    const { token } = req.query;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    res.status(200).json({
      success: true,
      message: 'Token verified!',
      id: decoded.id,
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.status(400).json({ error: 'Token expired' });
    } else {
      res.status(400).json({ error: 'Invalid token' });
    }
  }
};

module.exports = {
  sendVerificationToken,
  verifyToken,
};
