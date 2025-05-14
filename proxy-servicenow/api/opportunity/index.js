const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/Opportunity/getAllOpportunity');
const create = require('../../controllers/Opportunity/createOpportunity');
const update = require('../../controllers/Opportunity/updateOpportunity');
const getStages = require('../../controllers/Opportunity/SalesCycleType/getAll');
const getCycles = require('../../controllers/Opportunity/Stages/getAll');

// Define routes
router.get('/opportunity', getAll);
router.post('/opportunity', create);
router.patch('/opportunity/:id', update);

//stages
router.get('/opportunity-stage', getStages);
//Sales cycle type
router.get('/opportunity-sales-cycle-type', getCycles);
module.exports = router;