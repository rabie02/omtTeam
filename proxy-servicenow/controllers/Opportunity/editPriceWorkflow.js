const Opportunity = require("../../models/opportunity");
const opportunityLine = require("../../models/opportunityLine");
const handleMongoError = require("../../utils/handleMongoError");
const createPriceList = require('../PriceList/createPriceList');
const createPOPrice = require('../ProductOfferingPrice/createProductOfferingPrice');

const editOpportunityPrices = async (req, res) => {
    const { opportunityId, newPrices, priceListData } = req.body;
    
    try {
      // 1. Get existing opportunity with account info
      const opportunity = await Opportunity.findById(opportunityId).populate('account');
      
      if (!opportunity) {
        return res.status(404).json({
          success: false,
          error: 'Opportunity not found'
        });
      }

      // 2. Create new price list linked to opportunity's account
      const payload = req;
      payload.body = {
        ...req.body.priceListData,
        account: opportunity.account._id.toString()
      };
      const newPriceList = await createPriceList(payload);
      
      // 3. Create new product offering prices for the new price list
      const pricePromises = newPrices.map(async (priceData) => {
        try {
          const { productOffering, unitOfMeasure, ...otherPriceData } = priceData;
          
          payload.body = {
            ...otherPriceData,
            priceList: { id: newPriceList._id },
            productOffering: productOffering,
            unitOfMeasure: unitOfMeasure,
            lifecycleStatus: "Active",
            '@type': 'ProductOfferingPrice'
          };
          return await createPOPrice(payload);
        } catch (error) {
          throw new Error(`Failed to create price for ${priceData.name}: ${error.message}`);
        }
      });
      
      const updatedPrices = await Promise.all(pricePromises);
      
      
      // 4. Update all opportunity line items to use new price list
      await opportunityLine.updateMany(
        { opportunity: opportunityId },
        { price_list: newPriceList._id }
      );

      // 5. Update opportunity to use new price list
      await Opportunity.findByIdAndUpdate(opportunityId, {
        price_list: newPriceList._id
      });
      
      return res.status(200).json({
        success: true,
        message: 'Prices updated successfully',
        data: { newPriceList, updatedPrices }
      });
      
    } catch (error) {
        console.error('Error in opportunity creation:', error);
        const status = error.response?.status || 500;
        const message = error.response?.data?.error?.message || error.message;
        const mongoError = handleMongoError(error);
        return res.status(status).json({ 
          success: false,
          error: message,
          mongoErro: mongoError.message
        });
    }
};

module.exports = editOpportunityPrices;