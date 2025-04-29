const mongoose = require('mongoose');

const productOfferingCatalogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    required: true,
     enum: ['published', 'draft', 'archived', 'retired'], // Match JSON casing
    default: 'draft'
  },
  image: {
    type: String,
    default: ''
  },
  thumbnail: {
    type: String,
    default: ''
  },
  hierarchy_json: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    trim: true
  },
  external_id: {
    type: String,
    default: ''
  },
  is_default: {
    type: Boolean,
    default: false,
    set: v => v === 'true' || v === true // Converts string 'true'/'false' to boolean
  },
  number: {
    type: String,
    required: true,
    unique: true
  },
  sys_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sys_updated_by: {
    type: String,
    required: true
  },
  sys_created_on: {
    type: Date,
    required: true
  },
  sys_created_by: {
    type: String,
    required: true
  },
  sys_updated_on: {
    type: Date,
    required: true
  },
  sys_mod_count: {
    type: Number,
    default: 0,
    set: v => parseInt(v, 10) || 0 // Converts string numbers to integers
  },
  sys_tags: {
    type: String,
    default: ''
  },
  external_source: {
    type: String,
    default: ''
  },
  leaf_categories: [{
    type: String // Array of category IDs (as strings)
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductOfferingCategory'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductOfferingCatalog', productOfferingCatalogSchema);