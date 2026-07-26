import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Processing from './pages/Processing';
import Report from './pages/Report';
import ReportDetails from './pages/ReportDetails';
import AgentDetails from './pages/AgentDetails';
import AuditHistory from './pages/AuditHistory';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Profile from './pages/Profile';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Full-Width Pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Enterprise Portal Wrapped in Single Persistent Layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/processing" element={<Processing />} />
          <Route path="/report" element={<Report />} />
          <Route path="/report-details" element={<ReportDetails />} />
          <Route path="/agent-details" element={<AgentDetails />} />
          <Route path="/history" element={<AuditHistory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/help" element={<Help />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
