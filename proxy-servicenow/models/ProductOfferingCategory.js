const mongoose = require('mongoose');

const productOfferingCategorySchema = new mongoose.Schema({
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
    trim: true,
  },
  is_leaf: {
    type: Boolean,
    required: true,
    default: false,
    set: value => value === 'true'
  },
  start_date: {
    type: Date,
    required: true,
    set: value => new Date(value)
  },
  end_date: {
    type: Date,
    default: null,
    set: value => value ? new Date(value) : null
  },
  status: {
    type: String,
    required: true,
    enum: ['published', 'draft', 'archived', 'retired'],
    default: 'draft'
  },
  description: {
    type: String,
    trim: true
  },
  image: String,
  thumbnail: String,
  number: {
    type: String,
    required: true,
    unique: true
  },
  // System fields
  sys_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sys_created_by: {
    type: String,
    required: true
  },
  sys_updated_by: {
    type: String,
    required: true
  },
  sys_created_on: {
    type: Date,
    required: true,
    set: value => new Date(value)
  },
  sys_updated_on: {
    type: Date,
    required: true,
    set: value => new Date(value)
  },
  sys_mod_count: {
    type: Number,
    default: 0,
    set: value => parseInt(value, 10)
  },
  // Optional fields simplified
  external_id: String,
  sys_tags: String,
  leaf_categories: String,
  external_source: String,
}, {
  timestamps: true,
  versionKey: false,
});

module.exports = mongoose.model('ProductOfferingCategory', productOfferingCategorySchema);