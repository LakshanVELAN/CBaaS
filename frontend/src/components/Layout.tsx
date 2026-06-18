import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useState } from 'react';
import {
  LayoutDashboard, KeyRound, BookOpen, Map, FlaskConical,
  Plug, FileText, Users, CreditCard, Settings, MessageSquare,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/api-keys', label: 'API Keys', icon: <KeyRound size={18} /> },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: <BookOpen size={18} /> },
  { to: '/routes', label: 'Routes', icon: <Map size={18} /> },
  { to: '/playground', label: 'Playground', icon: <FlaskConical size={18} /> },
  { to: '/embed', label: 'Embed', icon: <Plug size={18} /> },
  { to: '/client-guide', label: 'Client Guide', icon: <FileText size={18} /> },
  { to: '/roles', label: 'Roles', icon: <Users size={18} /> },
  { to: '/billing', label: 'Billing', icon: <CreditCard size={18} /> },
  { to: '/settings', label: 'Settings', icon: <Settings size={18} /> },
];

export default function Layout() {
  const { tenant, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon"><MessageSquare size={22} /></span>
            <span className="logo-text">Chatbot SaaS</span>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="sidebar-plan">
          <span className={`plan-badge plan-${tenant?.plan || 'free'}`}>
            {tenant?.plan || 'Free'}
          </span>
          <span className="plan-quota">
            {tenant?.monthly_message_quota?.toLocaleString() || '-'} msg/mo
          </span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {tenant?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="user-info">
              <span className="user-name">{tenant?.name || 'User'}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <h1 className="page-title">
            {tenant?.name || 'Dashboard'}
          </h1>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
