import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import ProducerDashboard from './components/ProducerDashboard';
import RecyclerDashboard from './components/RecyclerDashboard';
import LogisticsDashboard from './components/LogisticsDashboard';
import RegulatorDashboard from './components/RegulatorDashboard';
import AdminDashboard from './components/AdminDashboard';
import RoleSelect from './components/RoleSelect';
import Web3 from 'web3';
import { testBlockchainConnection } from './utils/testConnection';
import { initWeb3 as initWeb3Helper } from './utils/web3Utils';

function App() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if MetaMask is available
    if (window.ethereum) {
      // Initial attempt to get accounts
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then(handleAccountsChanged)
        .catch(err => console.error(err));
      
      // Add listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    } else {
      console.log('Please install MetaMask to use this application');
    }
    
    // Check if user was previously logged in
    const savedAccount = localStorage.getItem('account');
    const savedRole = localStorage.getItem('userRole');
    
    if (savedAccount && savedRole) {
      setUserRole(savedRole);
      setIsAuthenticated(true);
      initWeb3();
    }
    
    // Make test connection function available from browser console
    window.testConnection = testBlockchainConnection;
    
    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);
  
  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User has disconnected all accounts
      console.log('Please connect to MetaMask.');
      setAccount('');
      handleLogout();
    } else if (accounts[0] !== account) {
      // Account changed
      setAccount(accounts[0]);
      console.log('Account changed to:', accounts[0]);
    }
  };

  const initWeb3 = async () => {
    console.log("Initializing Web3...");
    try {
      // Use helper from web3Utils.js
      const web3Instance = await initWeb3Helper();
      console.log("Web3 initialized:", web3Instance);
      
      setWeb3(web3Instance);
      
      // Get connected account
      const accounts = await web3Instance.eth.getAccounts();
      console.log("Current accounts:", accounts);
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
      
      return web3Instance;
    } catch (error) {
      console.error("Error initializing Web3:", error);
      return null;
    }
  };

  const handleLogin = async (role) => {
    try {
      console.log(`Attempting to login as ${role} with account ${account}`);
      
      if (!account) {
        // If account is not set, try to get it
        const web3Instance = await initWeb3();
        if (!web3Instance) {
          console.error("Failed to initialize Web3");
          return;
        }
        
        // If still no account after init, show error
        if (!account) {
          console.error("No account available. Please connect MetaMask first.");
          return;
        }
      }
      
      // Initialize Web3 if not already initialized
      if (!web3) {
        await initWeb3();
      }
      
      console.log(`Login successful as ${role} with account ${account}`);
      
      // Set user role and authentication state
      setUserRole(role);
      setIsAuthenticated(true);
      
      // Save to localStorage
      localStorage.setItem('account', account);
      localStorage.setItem('userRole', role);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = (changeRole = false) => {
    if (changeRole) {
      // Just remove the role but keep the account connected
      setIsAuthenticated(false);
      setUserRole('');
      localStorage.removeItem('userRole');
      
      // Redirect to the role selection page
      window.location.href = '/role-select';
    } else {
      // Full logout
      setIsAuthenticated(false);
      setUserRole('');
      localStorage.removeItem('account');
      localStorage.removeItem('userRole');
    }
  };

  // Determine the theme class based on user role
  const getThemeClass = () => {
    if (!isAuthenticated) return '';
    
    switch(userRole.toLowerCase()) {
      case 'producer':
        return 'producer-theme';
      case 'recycler':
        return 'recycler-theme';
      case 'logistics':
        return 'logistics-theme';
      case 'regulator':
        return 'regulator-theme';
      default:
        return '';
    }
  };

  return (
    <div className={`App ${getThemeClass()}`}>
      <Routes>
        <Route path="/" element={!isAuthenticated ? 
          <Login onLogin={handleLogin} account={account} /> : 
          <Navigate to={`/${userRole.toLowerCase()}`} />} 
        />
        <Route path="/about" element={
          <Login onLogin={handleLogin} account={account} initialSection="about" />
        } />
        <Route path="/features" element={
          <Login onLogin={handleLogin} account={account} initialSection="features" />
        } />
        <Route path="/how-it-works" element={
          <Login onLogin={handleLogin} account={account} initialSection="how-it-works" />
        } />
        <Route path="/stakeholders" element={
          <Login onLogin={handleLogin} account={account} initialSection="stakeholders" />
        } />
        <Route path="/producer" element={
          isAuthenticated && userRole === 'Producer' ? 
          <ProducerDashboard web3={web3} account={account} onLogout={handleLogout} /> : 
          <Navigate to="/" />} 
        />
        <Route path="/recycler" element={
          isAuthenticated && userRole === 'Recycler' ? 
          <RecyclerDashboard web3={web3} account={account} onLogout={handleLogout} /> : 
          <Navigate to="/" />} 
        />
        <Route path="/logistics" element={
          isAuthenticated && userRole === 'Logistics' ? 
          <LogisticsDashboard web3={web3} account={account} onLogout={handleLogout} /> : 
          <Navigate to="/" />} 
        />
        <Route path="/regulator" element={
          isAuthenticated && userRole === 'Regulator' ? 
          <RegulatorDashboard web3={web3} account={account} onLogout={handleLogout} /> : 
          <Navigate to="/" />} 
        />
        <Route path="/admin" element={
          account ? 
          <AdminDashboard web3={web3} account={account} onLogout={handleLogout} /> : 
          <Navigate to="/" />} 
        />
        <Route path="/role-select" element={
          account ? <RoleSelect onLogin={handleLogin} account={account} /> : <Navigate to="/" />
        } />
      </Routes>
    </div>
  );
}

export default App;