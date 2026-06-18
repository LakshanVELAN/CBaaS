import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/api-keys', label: 'API Keys', icon: '🔑' },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: '📚' },
  { to: '/routes', label: 'Routes', icon: '🗺️' },
  { to: '/playground', label: 'Playground', icon: '🧪' },
  { to: '/embed', label: 'Embed', icon: '🔌' },
  { to: '/client-guide', label: 'Client Guide', icon: '📖' },
  { to: '/roles', label: 'Roles', icon: '👤' },
  { to: '/billing', label: 'Billing', icon: '💳' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
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
            <span className="logo-icon">💬</span>
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
