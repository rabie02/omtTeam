const mongoose = require('mongoose');
const QuoteLine = require('../../models/quoteLine');
const Account = require('../../models/account');
const ProductOffering = require('../../models/ProductOffering');
const PriceList = require('../../models/priceList');
const handleMongoError = require('../../utils/handleMongoError');

module.exports = async (line_items, quote) => {
  try {
    // Validate all line items first
    const validationResults = await Promise.all(
      line_items.map(async (item) => {
        try {
          // Check existence of referenced documents using sys_id
          const [product, priceList] = await Promise.all([
            ProductOffering.findOne({ sys_id: item.product_offering }),
            PriceList.findOne({ sys_id: item.price_list }),
          ]);

          if (!product  || !priceList) {
            throw new Error('One or more referenced documents not found by sys_id');
          }

          // Create modified item with _id references
          const modifiedItem = {
            ...item,
            product_offering: product._id,
            price_list: priceList._id,
            quote: quote._id, 
          };

          return { valid: true, item: modifiedItem };
        } catch (error) {
          return { valid: false, error: error.message, item };
        }
      })
    );

    // Separate valid and invalid items
    const validItems = validationResults.filter(result => result.valid);
    const invalidItems = validationResults.filter(result => !result.valid);

    // Process only valid items
    const createPromises = validItems.map(async ({ item }) => {
      try {
        // Create quote line with modified item (already has _id references)
        const newQuoteLine = new QuoteLine(item);
        const savedLine = await newQuoteLine.save();
        return { success: true, data: savedLine };
      } catch (error) {
        return { 
          success: false, 
          error: handleMongoError(error).message, 
          item 
        };
      }
    });

    const creationResults = await Promise.all(createPromises);
    
    // Combine results
    const successfulCreations = creationResults.filter(r => r.success);
    const failedCreations = creationResults.filter(r => !r.success);

    return {
      success: true,
      created: successfulCreations.length,
      failed: invalidItems.length + failedCreations.length,
      details: {
        successful: successfulCreations,
        validationErrors: invalidItems,
        creationErrors: failedCreations
      }
    };

  } catch (error) {
    return handleMongoError(error);
  }
};