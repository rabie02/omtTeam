const Opportunity = require('../../models/opportunity');
const handleMongoError = require('../../utils/handleMongoError');
const quote = require('../../models/quote');
const opportunity = require('../../models/opportunity');

module.exports = async (req, res) => {
  try {
    const { 
      q: searchQuery, 
      number: numberQuery, 
      description: descQuery,
      page = 1, 
      limit = 6 
    } = req.query;
    
    let query = {};
    
    // Build search query
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      query.$or = [
        { short_description: { $regex: searchTerm, $options: 'i' } },
        { number: { $regex: searchTerm, $options: 'i' } }
      ];
    } else {
      // Field-specific searches if no general search query
      if (numberQuery) query.number = { $regex: numberQuery, $options: 'i' };
      if (descQuery) query.short_description = { $regex: descQuery, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCount = await Opportunity.countDocuments(query);

    // Fetch data with pagination
    const mongoData = await Opportunity.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('account', 'name email country city industry')
      .populate('price_list')
      .populate('sales_cycle_type')
      .populate('stage')
      .lean();

    // Get all opportunity IDs
    const opportunityIds = mongoData.map(opp => opp._id);

    // Lookup all line items for these opportunities
    const OpportunityLineItem = require('../../models/opportunityLine');
    const lineItems = await OpportunityLineItem.find({
      opportunity: { $in: opportunityIds }
    })
    .populate('productOffering')
    .lean();
  
    // Group line items by opportunity ID
    const lineItemsByOpportunity = {};
    lineItems.forEach(item => {
      const oppId = item.opportunity.toString();
      if (!lineItemsByOpportunity[oppId]) {
        lineItemsByOpportunity[oppId] = [];
      }
      lineItemsByOpportunity[oppId].push(item);
    });

    const quoteItem = await quote.find({
      opportunity : opportunityIds
    }).lean();

    // Format response with line items attached
    const formattedData = mongoData.map(item => ({
      ...item,
      _id: item._id.toString(),
      mongoId: item._id.toString(),
      line_items: lineItemsByOpportunity[item._id.toString()] || [] ,// Add line items here
      quote: quoteItem || [], 
    }));

    return res.json({
      success: true,
      data: formattedData,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    const mongoError = handleMongoError(error);
    return res.status(mongoError.status).json({ 
      success: false,
      error: mongoError.message 
    });
  }
};