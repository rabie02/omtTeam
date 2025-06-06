const express = require('express');
const router = express.Router();

// Import controllers
const getAll = require('../../controllers/Opportunity/getAllOpportunity');
const create = require('../../controllers/Opportunity/createOpportunity');
const updateOpportunity = require('../../controllers/Opportunity/updateOpportunity');
const deleteOpportunity = require('../../controllers/Opportunity/deleteOpportunity');
const workflow = require('../../controllers/Opportunity/workflow');

const getCycles = require('../../controllers/Opportunity/SalesCycleType/getAll');
const getStages = require('../../controllers/Opportunity/Stages/getAll');


// Define routes
router.get('/opportunity', getAll);
router.post('/opportunity', create);
router.patch('/opportunity/:id', updateOpportunity);
router.delete('/opportunity/:id', deleteOpportunity);

//workflow
router.post('/opportunity-workflow', workflow);
//stages
router.get('/opportunity-stage', getStages);
//Sales cycle type
router.get('/opportunity-sales-cycle-type', getCycles);

module.exports = router;