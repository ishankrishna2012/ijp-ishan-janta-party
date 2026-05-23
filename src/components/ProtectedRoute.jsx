import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // Neo-brutalist loading style
    return (
      <div className="bg-background text-on-background min-h-screen flex items-center justify-center flex-col relative font-body-md">
        <div className="scanlines absolute inset-0 pointer-events-none opacity-50 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.05)_51%)] bg-[size:100%_4px]"></div>
        <div className="border-4 border-on-surface p-6 bg-surface-container-lowest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative z-10 text-center">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4 block" style={{ fontSize: '48px' }}>radar</span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile uppercase tracking-widest leading-none mb-2">SECURE SYNC</h2>
          <p className="font-mono-style text-mono-style text-on-surface-variant uppercase animate-pulse">Decrypting operative credentials...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role checking
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If student tries to access admin, redirect to student hub
    if (user.role === 'student') {
      return <Navigate to="/student-hub" replace />;
    }
    // Fallback redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};
