const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/Opportunity/getAllOpportunity');
const create = require('../../controllers/Opportunity/createOpportunity');
const update = require('../../controllers/Opportunity/updateOpportunity');


// Define routes
router.get('/opportunity', getAll);
router.post('/opportunity', create);
router.patch('/opportunity/:id', update);

module.exports = router;