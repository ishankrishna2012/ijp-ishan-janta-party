import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Manifesto from './pages/Manifesto';
import TruthDirectorate from './pages/TruthDirectorate';
import StudentHub from './pages/StudentHub';
import AdminDashboard from './pages/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
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
  );
}

export default App;
