const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/OpportunityLine/getAllOpportunityLine');
const create = require('../../controllers/OpportunityLine/createOpportunityLine');
const update = require('../../controllers/OpportunityLine/updateOpportunityLine');

// Define routes
router.get('/opportunity-line', getAll);
router.post('/opportunity-line', create);
router.patch('/opportunity-line/:id', update);

module.exports = router;