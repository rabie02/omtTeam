const mongoose = require('mongoose');

const contractQuoteSchema = new mongoose.Schema({
  sys_id: {
    type: String,
    index: true
  },
  short_description: String,
  description: String,
  quote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
  },
  contract_model: {
    type:mongoose.Schema.Types.ObjectId,
    ref: 'contractModel',
  },
  product_offring: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductOffering',
  },
  

}, {
  timestamps: true,
  strict: false
});

module.exports =  mongoose.models.contractQuote || mongoose.model('contractQuote', contractQuoteSchema, 'contractQuotes');