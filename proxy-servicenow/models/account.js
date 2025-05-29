const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    sys_id: String,
    country: String,
    sys_created_on: String,
    state: String,
    sys_created_by: String,
    longitude: String,
    zip: String,
    business_owners: String,
    phone: String,
    city: String,
    latitude: String,
    industry: String,
    email: String,
    website: String,
    customer: String
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
    strict: false
});

module.exports = mongoose.model('Account', accountSchema, 'accounts');