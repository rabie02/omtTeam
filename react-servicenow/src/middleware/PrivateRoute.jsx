import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';  // Note: import named export 'jwtDecode'

// Function to check if token is valid
const isTokenValid = (token) => {
  try {
    const decoded = jwtDecode(token);  // Use the named import
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (e) {
    console.error('Invalid token:', e);
    return false;
  }
};

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  
  if (!token || !isTokenValid(token)) {
    // Clear invalid token
    localStorage.removeItem('access_token');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
