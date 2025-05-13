const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sub-schema for source and target objects
const referenceSchema = new Schema({
  link: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/i.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  value: { 
    type: String, 
    required: true,
    match: [/^[a-f0-9]{32}$/, 'Please provide a valid 32-character ID'] 
  }
}, { _id: false });

// Main schema
const serviceNowRecordSchema = new Schema({
  sys_id: { 
    type: String, 
    required: true,
    unique: true,
    match: [/^[a-f0-9]{32}$/, 'Please provide a valid 32-character sys_id']
  },
  sys_updated_by: { 
    type: String, 
    required: true,
    default: 'admin'
  },
  sys_created_on: { 
    type: Date, 
    required: true,
    set: function(v) {
      // Convert string date to Date object if needed
      return typeof v === 'string' ? new Date(v) : v;
    }
  },
  sys_mod_count: { 
    type: Number, 
    required: true,
    default: 0,
    min: 0,
    set: function(v) {
      // Convert string numbers to actual numbers
      return typeof v === 'string' ? parseInt(v, 10) : v;
    }
  },
  external_id: { 
    type: String, 
    default: '' 
  },
  source: { 
    type: referenceSchema, 
    required: true 
  },
  sys_updated_on: { 
    type: Date, 
    required: true,
    set: function(v) {
      return typeof v === 'string' ? new Date(v) : v;
    }
  },
  sys_tags: { 
    type: String, 
    default: '' 
  },
  sys_created_by: { 
    type: String, 
    required: true,
    default: 'admin'
  },
  external_source: { 
    type: String, 
    default: '' 
  },
  target: { 
    type: referenceSchema, 
    required: true 
  }
}, {
  timestamps: false, // Using custom timestamp fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for performance
serviceNowRecordSchema.index({ sys_id: 1 });

// Virtual for easy access to source and target IDs
serviceNowRecordSchema.virtual('source_id').get(function() {
  return this.source.value;
});

serviceNowRecordSchema.virtual('target_id').get(function() {
  return this.target.value;
});

const ServiceNowRecord = mongoose.model('ServiceNowRecord', serviceNowRecordSchema);

module.exports = ServiceNowRecord;