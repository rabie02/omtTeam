// src/routes/dashboardRoutes.jsx
import React from 'react';
import PrivateRoute from '../middleware/PrivateRoute'; // Make sure this exists
import DashboardLayout from '../layout/dashbord';
import Home from '../views/Pages/Dashboard/index'; 
import Catalog from '../views/Pages/ProductOffering/ProductOfferingCatalog/ProductOfferingCatalog'; 
import POCategory from '../views/Pages/ProductOffering/ProductOfferingCategory/ProductOfferingCategory';
import PO from '../views/Pages/ProductOffering/ProductOffering/ProductOffering';
import PS from '../views/Pages/ProductSpec/ProductSpec';
const dashboardRoutes = {
  path: '/dashboard',
  element: (
    <PrivateRoute>
      <DashboardLayout />
    </PrivateRoute>
  ),
  children: [
    { index: true, element: <Home /> },
    { path: 'catalog', element:<Catalog/>},
    { path: 'category', element:<POCategory/>},
    { path: 'product-offering', element:<PO/>},
    { path: 'product-specification', element:<PS/>},
    // ... other dashboard sub-routes
  ],
};

export default dashboardRoutes;
