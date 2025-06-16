const Opportunity = require('../../models/opportunity');
const OpportunityLineItem = require('../../models/opportunityLine');
const quote = require('../../models/quote');

const getOpportunityWithDetails = async (opportunityId) => {
  // Fetch opportunity with same population as getOneOpportunity
  const opportunity = await Opportunity.findById(opportunityId)
    .populate('account', 'name email country city industry')
    .populate('price_list')
    .populate('sales_cycle_type')
    .populate('stage')
    .lean();

  if (!opportunity) {
    throw new Error('Opportunity not found');
  }

  // Lookup line items for this specific opportunity
  const lineItems = await OpportunityLineItem.find({
    opportunity: opportunityId
  })
  .populate('productOffering')
  .lean();

  //lookup quote

  const quoteItem = await quote.find({
    opportunity : opportunityId
  }).lean();

  // Format response with line items attached
  const formattedOpportunity = {
    ...opportunity,
    _id: opportunity._id.toString(),
    mongoId: opportunity._id.toString(),
    line_items: lineItems || [],
    quote : quoteItem || []
  };

  return formattedOpportunity;
};

module.exports = getOpportunityWithDetails;