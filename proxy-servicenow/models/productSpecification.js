const mongoose = require('mongoose');

const ProductSpecSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  href: String,
  name: String,
  displayName: String,
  version: String,
  internalVersion: String,
  internalId: String,
  description: String,
  lastUpdate: Date,
  lifecycleStatus: String,
  isBundle: Boolean,
  validFor: {
    startDateTime: Date,
    endDateTime: Date
  },
  serviceSpecification: Array,
  productSpecificationRelationship: Array,
  resourceSpecification: Array,
  productSpecCharacteristic: Array,
  status: String
});

module.exports = mongoose.model('product_specifications', ProductSpecSchema);