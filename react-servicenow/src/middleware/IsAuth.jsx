import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const TokenValid = (token) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (e) {
    return false;
  }
};

const IsAuth = ({ children }) => {
  const token = localStorage.getItem('access_token');

  if (token && TokenValid(token)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


export default IsAuth;