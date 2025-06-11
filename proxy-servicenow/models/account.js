const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    sys_id: String,
    sys_created_on: String,
    sys_created_by: String,
    business_owners: String,
    phone: String,
    industry: String,
    email: String,
    website: String,
    customer: String
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
    strict: false
});

module.exports = mongoose.model('Account', accountSchema, 'accounts');