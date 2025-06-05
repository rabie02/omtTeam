import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import productOfferingCatalogReducer from '../features/servicenow/product-offering/productOfferingCatalogSlice';
import productOfferingCategoryReducer from '../features/servicenow/product-offering/productOfferingCategorySlice';
import productOfferingReducer from '../features/servicenow/product-offering/productOfferingSlice';
import productSpecificationReducer from '../features/servicenow/product-specification/productSpecificationSlice';
import channelReducer from '../features/servicenow/channel/channelSlice';
import aiSearchReducer from '../features/servicenow/ai-search/aiSearchSlice';
import opportunityReducer from '../features/servicenow/opportunity/opportunitySlice';
import priceListReducer from '../features/servicenow/price-list/priceListSlice';
import productOfferingPriceReducer from '../features/servicenow/product-offering-price/productOfferingPriceSlice';
import quoteReducer from "../features/servicenow/quote/quotaSlice"
const store = configureStore({
  reducer: {
    auth: authReducer,
    productOfferingCatalog: productOfferingCatalogReducer,
    productOfferingCategory: productOfferingCategoryReducer,
    productOffering: productOfferingReducer,
    productSpecification: productSpecificationReducer,
    channel: channelReducer,
    aiSearch: aiSearchReducer,
    opportunity: opportunityReducer,
    priceList: priceListReducer,
    quotes: quoteReducer,
    productOfferingPrice: productOfferingPriceReducer
  },
});

export default store;
