// src/routes/authRoutes.jsx
import React from 'react';
import Register from '../views/auth/Register';
import Login from '../views/auth/login';
import PrivateRoute from '../middleware/PrivateRoute';

// routes/auth.js
const authRoutes = [
  { path: '/', element: <Login /> },
  { path: '/register', element:
    <Register /> 
    },
  // ... other routes
];

export default authRoutes; 