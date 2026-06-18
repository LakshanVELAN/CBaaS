import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSuperAdminAuth } from './auth';
import { useState } from 'react';
import { LayoutDashboard, Building2, Shield, ArrowLeft, RefreshCw } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/superadmin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/superadmin/tenants', label: 'Tenants', icon: <Building2 size={18} /> },
];

export default function SuperAdminLayout() {
  const { user, logout } = useSuperAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/superadmin/login');
  };

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon"><Shield size={22} /></span>
            <span className="logo-text">Admin Panel</span>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="sidebar-plan">
          <span className="plan-badge plan-enterprise">Super Admin</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Admin'}</span>
              <span className="user-email" style={{ fontSize: '12px', color: '#94a3b8' }}>
                {user?.email}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
            <a href="/" className="btn btn-sm btn-secondary" style={{ textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ArrowLeft size={14} /> Back to App
            </a>
            <a href="/superadmin/login" className="btn btn-sm btn-secondary" style={{ textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <RefreshCw size={14} /> Switch Account
            </a>
            <button className="logout-btn" onClick={handleLogout}>
              Sign out
            </button>
          </div>
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
            Admin Panel
          </h1>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
