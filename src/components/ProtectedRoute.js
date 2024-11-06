// src/components/ProtectedRoute.js
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the navigation state allows access
    if (!location.state || !location.state.allowAccess) {
      // Redirect to the home page or another appropriate page
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  return children;
};

export default ProtectedRoute;
