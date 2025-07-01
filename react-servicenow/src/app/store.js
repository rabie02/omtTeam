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
import accountReducer from '../features/servicenow/account/accountSlice';
import contactReducer from '../features/servicenow/contact/contactSlice';
import locationReducer from '../features/servicenow/location/locationSlice';

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
    quote: quoteReducer,
    account: accountReducer,
    contact: contactReducer,
    location: locationReducer,
    productOfferingPrice: productOfferingPriceReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['opportunity/downloadContract/fulfilled'],
        // Ignore these paths in the state
        ignoredPaths: ['opportunity.downloadContract.file']
      }
    })
});

export default store;
