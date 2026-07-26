import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    let user = null;
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        user = null;
      }
    }

    // Require both/either valid token or authenticated user session
    if (!token && !user) {
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
}
