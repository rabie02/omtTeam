const mongoose = require('mongoose');

const ProductSpecCharacteristicValueSchema = new mongoose.Schema({
  value: { type: String, required: true },
  validFor: {
    startDateTime: { type: String, default: '' }
  }
}, { _id: false });

const ProductSpecCharacteristicSchema = new mongoose.Schema({
  productSpecCharacteristicValue: [ProductSpecCharacteristicValueSchema],
  name: { type: String, required: true },
  description: { type: String, default: '' },
  valueType: { type: String, default: 'choice' },
  validFor: {
    startDatetime: { type: String, default: '' }
  }
}, { _id: false });

const ValidForSchema = new mongoose.Schema({
  startDateTime: { type: String, required: true },
  endDateTime: { type: String, default: '' }
}, { _id: false });

const ProductSpecificationSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true,
    unique: true 
  },
  href: { 
    type: String, 
    default: function() {
      return `/api/sn_tmf_api/catalogmanagement/productSpecification/${this.id}`;
    }
  },
  name: { 
    type: String, 
    required: true,
    index: true 
  },
  displayName: { 
    type: String, 
    required: true 
  },
  version: { 
    type: String, 
    default: '' 
  },
  internalVersion: { 
    type: String, 
    required: true 
  },
  internalId: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  lastUpdate: { 
    type: String, 
    required: true,
    match: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/ 
  },
  lifecycleStatus: { 
    type: String, 
    required: true,
    enum: ['Active', 'Inactive', 'Pending', 'Retired'] 
  },
  isBundle: { 
    type: Boolean, 
    default: false 
  },
  validFor: { 
    type: ValidForSchema, 
    required: true 
  },
  serviceSpecification: { 
    type: [mongoose.Schema.Types.Mixed], 
    default: [] 
  },
  productSpecificationRelationship: { 
    type: [mongoose.Schema.Types.Mixed], 
    default: [] 
  },
  resourceSpecification: { 
    type: [mongoose.Schema.Types.Mixed], 
    default: [] 
  },
  productSpecCharacteristic: { 
    type: [ProductSpecCharacteristicSchema], 
    default: [] 
  },
  status: { 
    type: String, 
    required: true,
    enum: ['published', 'draft', 'archived'] 
  }
}, {
  timestamps: false,
  versionKey: false
});

module.exports = mongoose.model('product_specification', ProductSpecificationSchema);