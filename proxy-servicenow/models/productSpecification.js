const mongoose = require('mongoose');
const { Schema } = mongoose;

const validForSchema = new Schema({
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date }
}, { _id: false });

const productSpecificationSchema = new Schema({
  id: { type: String, required: true },
  href: { type: String },
  name: { type: String, default: '' },
  displayName: { type: String, default: '' },
  version: { type: String, default: '' },
  internalVersion: { type: String },
  internalId: { type: String },
  description: { type: String },
  lastUpdate: { type: Date },
  lifecycleStatus: { type: String, enum: ['Active', 'Inactive', 'Pending'] },
  isBundle: { type: Boolean, default: false },
  validFor: { type: validForSchema },
  serviceSpecification: { type: [Schema.Types.Mixed], default: [] },
  productSpecificationRelationship: { type: [Schema.Types.Mixed], default: [] },
  resourceSpecification: { type: [Schema.Types.Mixed], default: [] },
  productSpecCharacteristic: { type: [Schema.Types.Mixed], default: [] },
  status: { type: String, enum: ['active', 'retired', 'pending'] }
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

const ProductSpecification = mongoose.model('ProductSpecification', productSpecificationSchema, 'product_specifications');

module.exports = ProductSpecification;
