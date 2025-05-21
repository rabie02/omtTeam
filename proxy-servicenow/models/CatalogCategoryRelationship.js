const mongoose = require('mongoose');

const CatalogCategoryRelationSchema = new mongoose.Schema({
  sys_id: {
    type: String,
    required: true,
    trim: true
  },
  sys_updated_by: {
    type: String,
    trim: true
  },
  sys_created_on: {
    type: String,
    trim: true
  },
  sys_mod_count: {
    type: String,
    trim: true
  },
  external_id: {
    type: String,
    default: "",
    trim: true
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
    type: String,
    trim: true
  },
  sys_tags: {
    type: String,
    default: "",
    trim: true
  },
  sys_created_by: {
    type: String,
    trim: true
  },
  external_source: {
    type: String,
    default: "",
    trim: true
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