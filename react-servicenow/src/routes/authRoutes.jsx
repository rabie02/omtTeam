// src/routes/authRoutes.jsx
import React from 'react';
import Register from '../views/auth/Register';
import Login from '../views/auth/login';
import IsAuth from '../middleware/IsAuth';
import CreateAcc from '../components/createAccount/CreateAcc';
import VerifyToken from '../middleware/VerifyToken.jsx';
import VerificationErrorPage from '../views/error/VerificationErrorPage.jsx';

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
  { path: '/createAccount', element:<VerifyToken><CreateAcc /></VerifyToken> },
  { path: '/verification-error', element: <VerificationErrorPage /> }
  // ... other routes
];

export default authRoutes;