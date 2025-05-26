const mongoose = require('mongoose');

const salesCycleTypeSchema = new mongoose.Schema({
    sys_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: String
}, { timestamps: false });

module.exports = mongoose.model('salesCycleType', salesCycleTypeSchema, "salesCycleTypes");