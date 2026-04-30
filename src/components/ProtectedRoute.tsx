import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowDefaultCities?: boolean;
}

export function ProtectedRoute({ children, allowDefaultCities = false }: ProtectedRouteProps) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const { city } = useParams();

  const isDefaultCity = city === 'bangalore' || city === 'paris' || city === 'austin' || city === 'dharwad';

  if (!isAuthenticated && !(allowDefaultCities && isDefaultCity)) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
} 