// src/routes/dashboardRoutes.jsx
import React from 'react';
import PrivateRoute from '../middleware/PrivateRoute'; // Make sure this exists
import DashboardLayout from '../layout/dashbord';
import DashboardWithCharts from '../views/dashbord'; 
import Catalog from '../views/dashbord/ProductOfferingCatalog'; 
import POCategory from '../views/dashbord/ProductOfferingCategory';
import PO from '../views/dashbord/ProductOffering';
import PS from '../views/dashbord/ProductSpec';
import AiSearch from '../views/dashbord/ai-search';
import Quote from '../views/dashbord/quote';
import Profile from '../views/dashbord/ProfilePage'
import Opportunity from '../views/dashbord/Opportunity';
import PriceList from '../views/dashbord/PriceList';
import Account from '../views/dashbord/Account';
import Contact from '../views/dashbord/Contact';
import ProductDetails from '../views/dashbord/productdetail';  
import Location from '../views/dashbord/Location';



const dashboardRoutes = {
  path: '/dashboard',
  element: (
    <PrivateRoute>
      <DashboardLayout />
    </PrivateRoute>
  ),
  children: [
    { index: true, element: <DashboardWithCharts /> },
    { path: 'catalog', element:<Catalog/>},
    { path: 'category', element:<POCategory/>},
    { path: 'product-offering', element:<PO/>},
    { path: 'product-specification', element:<PS/>},
    { path: 'opportunity', element: <Opportunity />},
    { path: 'price-list', element: <PriceList />},
    { path: 'help', element:<AiSearch/>},
    { path: 'quote', element:<Quote/>},
    { path: 'profile', element:<Profile/>},
    { path: 'account', element:<Account/>},
    { path: 'products/:productId', element: <ProductDetails /> },
    { path: 'contact', element:<Contact/>},
    { path: 'location', element:<Location/>},
    // ... other dashboard sub-routes
  ],
};

export default dashboardRoutes;

