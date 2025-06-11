const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/OpportunityLine/getAllOpportunityLine');
const create = require('../../controllers/OpportunityLine/createOpportunityLine');
const update = require('../../controllers/OpportunityLine/updateOpportunityLine');
const deleteOP = require('../../controllers/OpportunityLine/deleteOpportuityline');
// Define routes
router.get('/opportunity-line', getAll);
router.post('/opportunity-line', create);
router.patch('/opportunity-line/:id', update);
router.delete('/opportunity-line/:id', deleteOP);

module.exports = router;