// src/router.jsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import ErrorPage from './views/error'

const router = createBrowserRouter([
  ...authRoutes,
 dashboardRoutes,
  {
    path: '*',
    element: <ErrorPage />
  }
]);

export default router;
