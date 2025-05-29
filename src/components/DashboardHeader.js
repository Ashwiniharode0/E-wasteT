import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * A shared dashboard header component providing consistent styling
 * across different role dashboards
 */
const DashboardHeader = ({ 
  title, 
  icon, 
  account, 
  onChangeRole, 
  onLogout,
  roleName 
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const roleIcons = {
    producer: '🏭',
    recycler: '♻️',
    logistics: '🚚',
    regulator: '📋',
    admin: '⚙️'
  };
  
  const roleColors = {
    producer: '#264653',
    recycler: '#2a9d8f',
    logistics: '#457b9d',
    regulator: '#f4a261',
    admin: '#2D6A4F'
  };
  
  const displayIcon = icon || roleIcons[roleName?.toLowerCase()] || '📊';
  const headerColor = roleColors[roleName?.toLowerCase()] || '#2D6A4F';
  
  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const handleClickOutside = (e) => {
    if (menuOpen && !e.target.closest('.menu-container')) {
      setMenuOpen(false);
    }
  };
  
  useEffect(() => {
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);
  
  return (
    <header className="dashboard-header" style={{ backgroundColor: headerColor }}>
      <div className="dashboard-header-content">
        <div className="header-title-section">
          <Link to="/" className="home-link">
            <span className="home-icon">🏠</span>
          </Link>
          <div className="divider"></div>
          <div className="header-title">
            <span className="header-icon">{displayIcon}</span> 
            <span className="header-text">{title || `${roleName} Dashboard`}</span>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="menu-container">
            <button 
              className="menu-button" 
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Open menu"
            >
              <span className="user-avatar">{displayIcon}</span>
            </button>
            
            {menuOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <span className="dropdown-title">Wallet Address</span>
                  <span className="dropdown-address">{truncateAddress(account)}</span>
                  <span className="dropdown-full-address" title={account}>{account}</span>
                </div>
                <div className="dropdown-separator"></div>
                <div className="dropdown-user-info">
                  <span className="user-role-badge" style={{ backgroundColor: headerColor }}>
                    <span className="role-badge-icon">{displayIcon}</span>
                    <span className="role-badge-text">{roleName}</span>
                  </span>
                </div>
                <div className="dropdown-separator"></div>
                <Link to="/" className="dropdown-item">
                  <span className="dropdown-icon">🏠</span>
                  <span>Home</span>
                </Link>
                <button className="dropdown-item" onClick={onChangeRole}>
                  <span className="dropdown-icon">🔄</span>
                  <span>Change Role</span>
                </button>
                <button className="dropdown-item logout-item" onClick={onLogout}>
                  <span className="dropdown-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;