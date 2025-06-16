// src/routes/authRoutes.jsx
import React from 'react';
import Register from '../views/auth/Register';
import Login from '../views/auth/login';
import IsAuth from '../middleware/IsAuth';
import CreateAcc from '../components/createAccount/CreateAcc';

const authRoutes = [
  // { path: '/', element: <Login /> },
  // { path: '/register', element: <Register /> },
  {
    path: '/',
    element: (
      <IsAuth>
        <Login />
      </IsAuth>
    ),
  },
  { path: '/createAccount', element:<CreateAcc /> },
  // ... other routes
];

export default authRoutes;