import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Cpu, 
  MessageSquareCode, 
  Network, 
  TrendingUp, 
  LogOut,
  Users,
  ChevronLeft,
  ChevronRight,
  Settings,
  History,
  AlertTriangle
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  
  if (!user) return null;

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  // Define sidebar links based on role
  const getLinks = () => {
    if (user.role === 'admin') {
      return [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Workspace Members', path: '/dashboard/members', icon: Users },
        { name: 'Documents', path: '/dashboard/documents', icon: FileText },
        { name: 'Assets', path: '/dashboard/assets', icon: Cpu },
        { name: 'AI Copilot', path: '/dashboard/copilot', icon: MessageSquareCode },
        { name: 'Knowledge Graph', path: '/dashboard/graph', icon: Network },
        { name: 'AI Insights', path: '/dashboard/insights', icon: TrendingUp },
        { name: 'Audit Logs', path: '/dashboard/audit-logs', icon: History },
        { name: 'Settings', path: '/dashboard/settings', icon: Settings },
      ];
    } else {
      return [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Assets', path: '/dashboard/assets', icon: Cpu },
        { name: 'AI Copilot', path: '/dashboard/copilot', icon: MessageSquareCode },
        { name: 'Knowledge Graph', path: '/dashboard/graph', icon: Network },
        { name: 'Documents', path: '/dashboard/documents', icon: FileText },
        { name: 'AI Insights', path: '/dashboard/insights', icon: TrendingUp },
        { name: 'Settings', path: '/dashboard/settings', icon: Settings },
      ];
    }
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 flex flex-col justify-between border-r border-dark-border bg-dark-card/90 backdrop-blur-md transition-all duration-300 ease-in-out will-change-[width,transform] lg:static lg:translate-x-0 lg:h-screen lg:relative ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Floating Collapse toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6.5 z-50 hidden lg:flex p-1 rounded-full border border-dark-border bg-dark-card/95 text-dark-muted hover:text-white hover:border-accent-teal transition-all cursor-pointer shadow-glow-teal"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3 text-accent-teal" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        <div>
          {/* Logo Brand */}
          <div className="flex items-center px-6 h-16 border-b border-dark-border">
            <div className="flex items-center gap-3 overflow-hidden">
              <img src="/logo.webp" alt="SamiQ Logo" className="w-8 h-8 shrink-0 object-contain rounded-lg shadow-glow-teal" />
              <div className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                isCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 w-auto'
              }`}>
                <h1 className="font-extrabold text-sm tracking-tight text-white font-sans leading-none">
                  SamiQ
                </h1>
                <p className="text-[9px] text-dark-muted font-semibold uppercase tracking-wider mt-1 leading-none">
                  {user.role === 'admin' ? 'Workspace Admin' : 'Workspace Member'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 py-6 space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  end={link.path === '/dashboard'}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => 
                    `group relative flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'bg-accent-teal/10 text-accent-teal border-l-2 border-accent-teal shadow-glow-teal' 
                        : 'text-dark-muted hover:text-white hover:bg-dark-border/40'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  
                  {/* Tooltip on hover when collapsed */}
                  <span className={`absolute left-16 scale-0 transition-all rounded bg-dark-border border border-accent-teal/20 px-3 py-1.5 text-xs text-white font-bold z-50 whitespace-nowrap shadow-glow-teal bg-dark-card/95 pointer-events-none ${
                    isCollapsed ? 'group-hover:scale-100' : ''
                  }`}>
                    {link.name}
                  </span>

                  {/* Inline link name */}
                  <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
                    isCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 w-auto'
                  }`}>
                    {link.name}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-dark-border">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-accent-rose/20 bg-accent-rose/5 hover:bg-accent-rose/10 text-xs text-accent-rose font-bold transition-all duration-200 cursor-pointer"
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
              isCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 w-auto'
            }`}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Sign Out Confirmation Modal */}
      {showLogoutModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-6 space-y-5 animate-slide-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-rose/10 border border-accent-rose/30 flex items-center justify-center text-accent-rose shrink-0">
                <AlertTriangle className="w-5 h-5 text-accent-rose" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Sign Out Confirmation</h3>
                <p className="text-xs text-dark-muted mt-0.5">End active workspace session</p>
              </div>
            </div>

            <p className="text-xs text-dark-muted leading-relaxed">
              Are you sure you want to sign out of your workspace account? You will need to log back in to access telemetry and technical manuals.
            </p>

            <div className="flex justify-end gap-3 pt-2 border-t border-dark-border">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-lg border border-dark-border bg-dark-bg hover:bg-dark-border/40 text-xs text-dark-muted hover:text-white font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-rose hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-950/20 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-white" />
                Sign Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Sidebar;
