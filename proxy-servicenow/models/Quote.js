const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        unique: true
    },
    sys_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    channel: {
        type: String,
        required: true,
    },
    state: {
        type: String,
    },
    version: {
        type: String,
        required: true
    },
    total_amount: String,
    currency: String,
    assigned_to: String,
    assignment_group: String,
    subscription_start_date: String,
    subscription_end_date: String,
    short_description: String,
    active: {
        type: String,
        default: 'true'
    }
}, { timestamps: false });

module.exports = mongoose.model('Quote', quoteSchema);