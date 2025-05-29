const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
    sys_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: String,
    type: String,
    sys_name: String,
    order: String
}, { timestamps: false });

module.exports = mongoose.model('Stage', stageSchema, "Stages");