import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

// Pages imports
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardLayout from './pages/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import AssetsPage from './pages/AssetsPage';
import AssetDetailPage from './pages/AssetDetailPage';
import CopilotPage from './pages/CopilotPage';
import GraphPage from './pages/GraphPage';
import InsightsPage from './pages/InsightsPage';
import ProfilePage from './pages/ProfilePage';
import MembersPage from './pages/MembersPage';
import ImportMembersPage from './pages/ImportMembersPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogPage from './pages/AuditLogPage';

// Component to dynamically change tab title based on active path
const TitleUpdater: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'SamiQ | Industrial AI Workspace';

    if (path === '/') {
      title = 'SamiQ | Secure Operational Memory';
    } else if (path === '/login') {
      title = 'SamiQ | Access Workspace';
    } else if (path === '/dashboard') {
      title = 'SamiQ | Operations Dashboard';
    } else if (path.startsWith('/dashboard/documents')) {
      title = 'SamiQ | Technical Manuals Ingestion';
    } else if (path.includes('/dashboard/assets/')) {
      title = 'SamiQ | Monitored Asset Diagnostics';
    } else if (path.startsWith('/dashboard/assets')) {
      title = 'SamiQ | Asset Registry';
    } else if (path.startsWith('/dashboard/copilot')) {
      title = 'SamiQ | AI Copilot Chat';
    } else if (path.startsWith('/dashboard/graph')) {
      title = 'SamiQ | Interactive Knowledge Graph';
    } else if (path.startsWith('/dashboard/insights')) {
      title = 'SamiQ | Operation Insights & Alarms';
    } else if (path.startsWith('/dashboard/profile')) {
      title = 'SamiQ | Staff Profile';
    } else if (path === '/dashboard/members/import') {
      title = 'SamiQ | Import Workspace Members';
    } else if (path.startsWith('/dashboard/members')) {
      title = 'SamiQ | Manage Workspace Members';
    } else if (path.startsWith('/dashboard/settings')) {
      title = 'SamiQ | Settings';
    } else if (path.startsWith('/dashboard/audit-logs')) {
      title = 'SamiQ | Workspace Audit Logs';
    }

    document.title = title;
  }, [location]);

  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <TitleUpdater />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Authenticated Dashboard Nested Routes */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="assets" element={<AssetsPage />} />
                <Route path="assets/:id" element={<AssetDetailPage />} />
                <Route path="copilot" element={<CopilotPage />} />
                <Route path="graph" element={<GraphPage />} />
                <Route path="insights" element={<InsightsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="members" element={<MembersPage />} />
                <Route path="members/import" element={<ImportMembersPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="audit-logs" element={<AuditLogPage />} />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
