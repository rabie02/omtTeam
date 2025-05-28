const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
    number: {
        type: String,
   
        unique: true
    },
    sys_id: {
        type: String,
   
        unique: true,
        index: true
    },
    state: {
        type: String,
    },
    version: {
        type: String,
        
    },
    currency: String,
    assigned_to: String,
    assignment_group: String,
    subscription_start_date: String,
    subscription_end_date: String,
    short_description: String,
    expiration_date: String,

    active: {
        type: String,
        default: 'true'
    },
    opportunity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Opportunity',
        required: true
    },
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    price_list: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PriceList'
    },

}, { timestamps: true });

// Define the virtual for quote lines
quoteSchema.virtual('quote_lines', {
  ref: 'QuoteLine', // The model to use
  localField: '_id', // Field in the Quote model
  foreignField: 'quote', // Field in the QuoteLine model
  justOne: false // Set to false for a 'has many' relationship
});

module.exports = mongoose.model('Quote', quoteSchema,'quotes');