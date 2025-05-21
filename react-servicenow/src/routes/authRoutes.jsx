// src/routes/authRoutes.jsx
import React from 'react';
import Register from '../views/auth/Register';
import Login from '../views/auth/login';
import PrivateRoute from '../middleware/PrivateRoute';
import CreateAccount from '../components/createAccount/createAccount';

// routes/auth.js
const authRoutes = [
  { path: '/', element: <Login /> },
  { path: '/register', element:<Register /> },
    { path: '/createAccount', element:<CreateAccount /> },
  // ... other routes
];

export default authRoutes; 