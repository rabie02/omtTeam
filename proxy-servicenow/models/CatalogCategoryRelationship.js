const mongoose = require('mongoose');

const CatalogCategoryRelationSchema = new mongoose.Schema({
  sys_id: {
    type: String,
    required: true,
    unique: true,
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
    type: String,
    required: true,
    trim: true,
    set: function(v) {
      // Extract 'value' property if the input is an object
      return v && typeof v === 'object' ? v.value : v;
    }
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
    type: String,
    required: true,
    trim: true,
    set: function(v) {
      // Extract 'value' property if the input is an object
      return v && typeof v === 'object' ? v.value : v;
    }
  },
  catalog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductOfferingCatalog',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductOfferingCategory',
    required: true
  },
});

// Indexes for fast querying
CatalogCategoryRelationSchema.index({ catalog: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('CatalogCategoryRelations', CatalogCategoryRelationSchema);