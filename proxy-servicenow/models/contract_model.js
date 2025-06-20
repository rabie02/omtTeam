const mongoose = require('mongoose');

const contractModelSchema = new mongoose.Schema({
  sys_id: {
    type: String,
    index: true
  },
  name: String,
  description: String
  
  

}, {
  timestamps: true,
  strict: false
});

module.exports =  mongoose.models.contractModel || mongoose.model('contractModel', contractModelSchema, 'contract_model');