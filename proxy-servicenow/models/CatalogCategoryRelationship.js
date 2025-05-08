const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sourceTargetSchema = new Schema({
  link: { type: String, required: true },
  value: { type: String, required: true }
});

const recordSchema = new Schema({
  sys_id: { 
    type: String, 
    required: true,
    unique: true 
  },
  sys_updated_by: { 
    type: String, 
    default: 'admin' 
  },
  sys_created_on: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  sys_mod_count: { 
    type: Number, 
    default: 0 
  },
  external_id: { 
    type: String, 
    default: '' 
  },
  source: { 
    type: sourceTargetSchema,
    required: true 
  },
  sys_updated_on: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  sys_tags: { 
    type: String, 
    default: '' 
  },
  sys_created_by: { 
    type: String, 
    default: 'admin' 
  },
  external_source: { 
    type: String, 
    default: '' 
  },
  target: { 
    type: sourceTargetSchema,
    required: true 
  }
}, {
  timestamps: false, // Since we're managing our own timestamp fields
  versionKey: false  // Disable the __v field
});

// Add indexes
recordSchema.index({ sys_id: 1 });


const CatalogCategoryRelationship = mongoose.model('CatalogCategoryRelationship', recordSchema);

module.exports = CatalogCategoryRelationship;