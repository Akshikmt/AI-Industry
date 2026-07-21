import React, { useState } from 'react';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import { Menu, Server, CheckCircle2, Bell, Sun, Moon } from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center text-dark-text p-6">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-dark-border"></div>
          <div className="absolute inset-0 rounded-full border-4 border-accent-teal border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-semibold tracking-wide text-dark-muted font-sans animate-pulse">
          Decrypting Session...
        </p>
      </div>
    );
  }

  // 2. Auth Protection Redirection
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex bg-dark-bg text-dark-text overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        isCollapsed={sidebarCollapsed} 
        setIsCollapsed={setSidebarCollapsed} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header / Top Navigation */}
        <header className="h-16 border-b border-dark-border bg-dark-card/30 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-dark-border bg-dark-bg text-dark-muted hover:text-white hover:border-accent-teal lg:hidden transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-dark-border bg-dark-card/50 text-dark-muted hover:text-white hover:border-accent-teal/50 transition-all cursor-pointer flex items-center justify-center relative group animate-slide-in"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 transition-transform duration-300 group-hover:rotate-[15deg]" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 group-hover:rotate-[30deg]" />
              )}
            </button>

            {/* Notification Bell */}
            <button className="p-2 rounded-xl border border-dark-border bg-dark-card/50 text-dark-muted hover:text-white hover:border-accent-teal/50 transition-all cursor-pointer flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </button>

            {/* Clean Profile Link */}
            <NavLink 
              to="/dashboard/profile"
              className="flex flex-col items-center gap-1 bg-transparent transition-all group py-1"
            >
              <div className="w-8 h-8 rounded-full border border-accent-teal/30 flex items-center justify-center font-bold text-xs text-accent-teal uppercase group-hover:bg-accent-teal/20 transition-all overflow-hidden bg-accent-teal/10 shrink-0">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user.name.substring(0, 2)
                )}
              </div>
              <span className="text-[10px] font-bold text-dark-muted group-hover:text-white transition-colors font-sans leading-none">
                My Profile
              </span>
            </NavLink>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
