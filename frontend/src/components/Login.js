import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Login = ({ onLogin, account, initialSection = 'about' }) => {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    if (account) {
      setConnecting(false);
    }
  }, [account]);

  const connectWallet = async () => {
    setConnecting(true);
    setError('');
    
    try {
      if (window.ethereum) {
        // This will prompt the user to connect their wallet if not already connected
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        console.log('Connected accounts:', accounts);
        
        if (accounts.length === 0) {
          throw new Error('No accounts found. Please connect to MetaMask.');
        }
        
        // We don't need to manually set the account state here
        // It will be handled by the accountsChanged event listener in App.js
      } else {
        throw new Error('MetaMask not detected! Please install MetaMask extension.');
      }
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      setError(error.message || 'Failed to connect to MetaMask');
      setConnecting(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleLogin = () => {
    if (selectedRole) {
      onLogin(selectedRole);
    }
  };

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">E-Waste Tracking System</h1>
          <p className="hero-subtitle">Blockchain-powered solution for transparent, compliant, and sustainable electronic waste management</p>
          
          {!account ? (
            <button 
              className="cta-button" 
              onClick={connectWallet} 
              disabled={connecting}
            >
              {connecting ? 'Connecting...' : 'Connect with MetaMask'}
            </button>
          ) : (
            <button 
              className="cta-button" 
              onClick={() => setActiveSection('roles')}
            >
              Continue to Dashboard
            </button>
          )}
        </div>
      </div>

      <div className="nav-tabs">
        <Link 
          to="/about"
          className={`tab-btn ${activeSection === 'about' ? 'active' : ''}`} 
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('about');
          }}
        >
          About
        </Link>
        <Link 
          to="/features"
          className={`tab-btn ${activeSection === 'features' ? 'active' : ''}`} 
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('features');
          }}
        >
          Features
        </Link>
        <Link 
          to="/how-it-works"
          className={`tab-btn ${activeSection === 'how-it-works' ? 'active' : ''}`} 
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('how-it-works');
          }}
        >
          How It Works
        </Link>
        <Link 
          to="/stakeholders"
          className={`tab-btn ${activeSection === 'stakeholders' ? 'active' : ''}`} 
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('stakeholders');
          }}
        >
          Stakeholders
        </Link>
        {account && (
          <Link 
            to="/role-select"
            className={`tab-btn ${activeSection === 'roles' ? 'active' : ''}`} 
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('roles');
            }}
          >
            Select Role
          </Link>
        )}
      </div>

      <div className="content-section">
        {activeSection === 'about' && (
          <div className="section-content fade-in">
            <h2>About the E-Waste Tracking System</h2>
            <p>
              Our blockchain-based E-Waste Tracking System revolutionizes how electronic waste is managed throughout its lifecycle. 
              From production to recycling, our platform ensures complete transparency, regulatory compliance, and sustainability.
            </p>
            <p>
              Electronic waste is one of the fastest-growing waste streams globally, with millions of tons generated annually. 
              Proper tracking and management of e-waste is crucial for environmental protection, resource conservation, and regulatory compliance.
            </p>
            <div className="stats-highlight">
              <div className="stat-item">
                <h3>50M+</h3>
                <p>Tons of e-waste generated globally each year</p>
              </div>
              <div className="stat-item">
                <h3>17.4%</h3>
                <p>Global e-waste recycling rate</p>
              </div>
              <div className="stat-item">
                <h3>$62.5B</h3>
                <p>Value of raw materials in e-waste</p>
              </div>
            </div>
            <p>
              Our system leverages Ethereum blockchain technology to create an immutable record of e-waste items,
              ensuring accountability and enabling efficient recycling processes while meeting regulatory requirements.
            </p>
          </div>
        )}

        {activeSection === 'features' && (
          <div className="section-content fade-in">
            <h2>Key Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3>Secure Blockchain Infrastructure</h3>
                <p>Immutable record-keeping ensures data integrity and transparency throughout the e-waste lifecycle.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h3>Complete Lifecycle Tracking</h3>
                <p>Monitor e-waste from production through transportation to final recycling with real-time updates.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">👥</div>
                <h3>Role-Based Access Control</h3>
                <p>Specialized dashboards for producers, recyclers, logistics partners, and regulatory authorities.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h3>Detailed Analytics</h3>
                <p>Comprehensive reporting tools for analyzing waste streams, recycling rates, and compliance metrics.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">✅</div>
                <h3>Regulatory Compliance</h3>
                <p>Built-in compliance management to meet local and international e-waste regulations.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔄</div>
                <h3>Smart Contract Integration</h3>
                <p>Automated processes using smart contracts for verification, handoffs, and compliance auditing.</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'how-it-works' && (
          <div className="section-content fade-in">
            <h2>How It Works</h2>
            <div className="workflow">
              <div className="workflow-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3>Producer Registration</h3>
                  <p>Electronics manufacturers and distributors register new e-waste items with detailed specifications.</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3>Logistics Handling</h3>
                  <p>Logistics partners update transport status and chain of custody for e-waste shipments.</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3>Recycler Processing</h3>
                  <p>Recycling facilities document receipt and processing methodologies for each waste stream.</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3>Regulatory Oversight</h3>
                  <p>Regulators access comprehensive data for auditing compliance with environmental regulations.</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-number">5</div>
                <div className="step-content">
                  <h3>Verification & Certification</h3>
                  <p>Smart contracts verify proper handling, generating compliance certificates and completion records.</p>
                </div>
              </div>
            </div>
            <div className="tech-stack">
              <h3>Technology Stack</h3>
              <div className="tech-items">
                <div className="tech-item">
                  <span>Ethereum</span>
                </div>
                <div className="tech-item">
                  <span>Solidity Smart Contracts</span>
                </div>
                <div className="tech-item">
                  <span>React.js</span>
                </div>
                <div className="tech-item">
                  <span>Web3.js</span>
                </div>
                <div className="tech-item">
                  <span>MetaMask</span>
                </div>
                <div className="tech-item">
                  <span>Truffle</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'stakeholders' && (
          <div className="section-content fade-in">
            <h2>Key Stakeholders</h2>
            <div className="stakeholders-grid">
              <div className="stakeholder-card">
                <div className="stakeholder-icon" style={{ color: '#264653' }}>🏭</div>
                <h3>Producers</h3>
                <p>Electronics manufacturers who generate e-waste through production or take-back programs.</p>
                <ul>
                  <li>Register new e-waste items</li>
                  <li>Provide detailed product specifications</li>
                  <li>Monitor proper disposal</li>
                  <li>Generate compliance reports</li>
                </ul>
              </div>
              <div className="stakeholder-card">
                <div className="stakeholder-icon" style={{ color: '#2a9d8f' }}>♻️</div>
                <h3>Recyclers</h3>
                <p>Organizations that process e-waste to recover valuable materials and ensure proper disposal.</p>
                <ul>
                  <li>Verify received e-waste items</li>
                  <li>Document recycling processes</li>
                  <li>Report recovery rates</li>
                  <li>Issue recycling certificates</li>
                </ul>
              </div>
              <div className="stakeholder-card">
                <div className="stakeholder-icon" style={{ color: '#457b9d' }}>🚚</div>
                <h3>Logistics</h3>
                <p>Transportation and storage providers who move e-waste between locations.</p>
                <ul>
                  <li>Track e-waste in transit</li>
                  <li>Verify chain of custody</li>
                  <li>Document handling procedures</li>
                  <li>Ensure proper waste segregation</li>
                </ul>
              </div>
              <div className="stakeholder-card">
                <div className="stakeholder-icon" style={{ color: '#f4a261' }}>📋</div>
                <h3>Regulators</h3>
                <p>Government agencies and compliance organizations that oversee e-waste management.</p>
                <ul>
                  <li>Audit compliance with regulations</li>
                  <li>Verify proper waste handling</li>
                  <li>Access comprehensive reports</li>
                  <li>Enforce environmental standards</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'roles' && (
          <div className="section-content fade-in">
            <div className="role-selection-container">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <h2>Select Your Role</h2>
              <p className="account-info">Connected as: <span>{account}</span></p>
              
              <div className="role-grid">
                <div 
                  className={`role-card ${selectedRole === 'Producer' ? 'active' : ''}`} 
                  onClick={() => handleRoleSelect('Producer')}
                >
                  <div className="role-icon" style={{ color: '#264653' }}>🏭</div>
                  <div className="role-title">Producer</div>
                  <div className="role-description">Register and track e-waste products</div>
                </div>
                
                <div 
                  className={`role-card ${selectedRole === 'Recycler' ? 'active' : ''}`} 
                  onClick={() => handleRoleSelect('Recycler')}
                >
                  <div className="role-icon" style={{ color: '#2a9d8f' }}>♻️</div>
                  <div className="role-title">Recycler</div>
                  <div className="role-description">Process and document e-waste recycling</div>
                </div>
                
                <div 
                  className={`role-card ${selectedRole === 'Logistics' ? 'active' : ''}`} 
                  onClick={() => handleRoleSelect('Logistics')}
                >
                  <div className="role-icon" style={{ color: '#457b9d' }}>🚚</div>
                  <div className="role-title">Logistics</div>
                  <div className="role-description">Manage e-waste transportation</div>
                </div>
                
                <div 
                  className={`role-card ${selectedRole === 'Regulator' ? 'active' : ''}`} 
                  onClick={() => handleRoleSelect('Regulator')}
                >
                  <div className="role-icon" style={{ color: '#f4a261' }}>📋</div>
                  <div className="role-title">Regulator</div>
                  <div className="role-description">Audit compliance and oversight</div>
                </div>
              </div>
              
              <button 
                className="action-button" 
                onClick={handleLogin}
                disabled={!selectedRole}
              >
                Continue as {selectedRole || 'Selected Role'}
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>E-Waste Tracking System</h3>
            <p>A blockchain-based solution for transparent and efficient electronic waste management.</p>
          </div>
          <div className="footer-section">
            <h3>Explore</h3>
            <ul className="footer-links">
              <li><Link to="/about" onClick={(e) => { e.preventDefault(); setActiveSection('about'); }}>About</Link></li>
              <li><Link to="/features" onClick={(e) => { e.preventDefault(); setActiveSection('features'); }}>Features</Link></li>
              <li><Link to="/how-it-works" onClick={(e) => { e.preventDefault(); setActiveSection('how-it-works'); }}>How It Works</Link></li>
              <li><Link to="/stakeholders" onClick={(e) => { e.preventDefault(); setActiveSection('stakeholders'); }}>Stakeholders</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Powered By</h3>
            <div className="footer-tech">
              <span>Ethereum</span>
              <span>React</span>
              <span>Web3.js</span>
              <span>Solidity</span>
            </div>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <p>For support or inquiries:<br/>support@ewaste-tracking.com</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 E-Waste Tracking System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;