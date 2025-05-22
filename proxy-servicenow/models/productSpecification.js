const mongoose = require('mongoose');

const productSpecificationSchema = new mongoose.Schema({
  // Keep MongoDB's default _id
  // Store ServiceNow's sys_id as a separate field
  sys_id: {
    type: String,
    required: true,
    unique: true,
    index: true  // Add index for faster queries
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductOfferingCategory',
    required: true
  },
  display_name: String,
  specification_category: String,
  specification_type: String,
  start_date: String,
  description: String,
  status: String
}, {
  timestamps: true,
  strict: false
});

const ProductSpecification = mongoose.model('ProductSpecification', productSpecificationSchema, 'product_specifications');

module.exports = ProductSpecification;
