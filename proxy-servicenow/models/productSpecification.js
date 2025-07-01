const mongoose = require('mongoose');

const productSpecificationSchema = new mongoose.Schema({
  // Keep MongoDB's default _id
  // Store ServiceNow's sys_id as a separate field
  sys_id: {
    type: String,
    //required: true,
    unique: true,
    index: true  // Add index for faster queries
  },
  display_name: String,
  specification_category: String,
  specification_type: String,
  start_date: String,
  description: String,
  status: String
}, {
  timestamps: true,
  strict:false,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

productSpecificationSchema.virtual('productOffering', {
  ref: 'ProductOffering',
  localField: '_id',
  foreignField: 'productSpecification',
});


const ProductSpecification = mongoose.model('ProductSpecification', productSpecificationSchema, 'product_specifications');

module.exports = ProductSpecification;
