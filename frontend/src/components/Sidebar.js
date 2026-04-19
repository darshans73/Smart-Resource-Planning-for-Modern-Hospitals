import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['admin','doctor','nurse','reception'] },
  { to: '/resources', icon: '🏗️', label: 'Resources', roles: ['admin','doctor','nurse','reception'] },
  { to: '/patients', icon: '👥', label: 'Patients', roles: ['admin','doctor','nurse','reception'] },
  { to: '/allocations', icon: '🛏️', label: 'Bed Allocation', roles: ['admin','reception'] },
  { to: '/floor-plan', icon: '🗺️', label: 'Interactive MAP', roles: ['admin','doctor','nurse','reception'] },
  { to: '/surgeries', icon: '🔬', label: 'OT Scheduling', roles: ['admin','doctor','nurse'] },
  { to: '/equipment', icon: '⚕️', label: 'Equipment', roles: ['admin','doctor','nurse'] },
  { to: '/ai-predictions', icon: '🤖', label: 'AI Predictor', roles: ['admin','doctor','nurse','reception'] },
  { to: '/reports', icon: '📈', label: 'Reports', roles: ['admin'] },
  { to: '/users', icon: '👤', label: 'User Management', roles: ['admin'] },
];

const Sidebar = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const roleColor = {
    admin: 'var(--danger)',
    doctor: 'var(--primary)',
    nurse: 'var(--success)',
    reception: 'var(--warning)'
  };

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">🏥</div>
          <div className="logo-text">
            Hospital RMS
            <span>Resource Management</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {filteredNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role" style={{ color: roleColor[user?.role] }}>
              ● {user?.role}
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">⏏</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
