import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Manifesto from './pages/Manifesto';
import TruthDirectorate from './pages/TruthDirectorate';
import StudentHub from './pages/StudentHub';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import CommsLink from './pages/CommsLink';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const missingEnvVars = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <>
      {missingEnvVars && (
        <div className="bg-error text-on-error p-4 text-center font-bold font-mono-style uppercase z-50 relative border-b-4 border-on-surface">
          CRITICAL DEPLOYMENT ERROR: Missing Supabase Environment Variables in Netlify. Backend connectivity neutralized. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </div>
      )}
      <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/manifesto" element={<Manifesto />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Student / Admin Routes */}
        <Route 
          path="/student-hub" 
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <StudentHub />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/truth-directorate" 
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <TruthDirectorate />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <Profile />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/comms-link" 
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <CommsLink />
            </ProtectedRoute>
          } 
        />

        {/* Protected Admin Only Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </>
  );
}

export default App;
