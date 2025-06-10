const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  opportunity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity'
  },
  quote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote'
  },
  file_name: {
    type: String,
    trim: true
  },
  download_url: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
contractSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Create text index for search functionality
contractSchema.index({
  file_name: 'text'
});

module.exports = mongoose.model('Contract', contractSchema, 'contracts');