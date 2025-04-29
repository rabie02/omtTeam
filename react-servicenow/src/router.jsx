// src/router.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

const router = createBrowserRouter([
  ...authRoutes,
 dashboardRoutes,
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default router;
