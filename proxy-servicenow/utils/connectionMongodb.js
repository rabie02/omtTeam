// connection.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables (if not already loaded in app.js)
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas!');
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1); // Exit the process on connection failure
  }
};

module.exports = connectDB;