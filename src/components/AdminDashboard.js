import React, { useState, useEffect } from 'react';
import UserManagementABI from '../contracts/UserManagementABI.json';
import config from '../config';

const AdminDashboard = ({ web3, account, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  
  // Registration form
  const [registerForm, setRegisterForm] = useState({
    address: '',
    name: '',
    role: '0',
    contactInfo: ''
  });
  
  // Contract instance
  const [userContract, setUserContract] = useState(null);

  useEffect(() => {
    const initContract = async () => {
      try {
        if (!web3) {
          console.error("Web3 instance not available");
          return;
        }
        
        // Get contract address from config
        const { userManagementAddress } = config.contracts;
        
        // Create contract instance
        const userManagementInstance = new web3.eth.Contract(
          UserManagementABI,
          userManagementAddress
        );
        
        setUserContract(userManagementInstance);
        
        // Check if current user is admin
        const adminAddress = await userManagementInstance.methods.admin().call();
        const isCurrentUserAdmin = (adminAddress.toLowerCase() === account.toLowerCase());
        setIsAdmin(isCurrentUserAdmin);
        
        if (!isCurrentUserAdmin) {
          setError('You are not authorized to access the admin dashboard.');
          setLoading(false);
          return;
        }
        
        // Load all users (simplified - in a real app you'd need pagination and search)
        // This is a placeholder as the actual contract doesn't expose this functionality
        // In a production app, you would implement an event listener for UserRegistered events
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing contract:', error);
        setError(error.message || 'Failed to connect to blockchain');
        setLoading(false);
      }
    };
    
    if (web3 && account) {
      initContract();
    }
  }, [web3, account]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm({
      ...registerForm,
      [name]: value
    });
  };

  const registerUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await userContract.methods.registerUserWithAddress(
        registerForm.address,
        registerForm.name,
        parseInt(registerForm.role),
        registerForm.contactInfo
      ).send({ from: account });
      
      alert('User registered successfully!');
      
      // Reset form
      setRegisterForm({
        address: '',
        name: '',
        role: '0',
        contactInfo: ''
      });
    } catch (error) {
      console.error('Error registering user:', error);
      alert(`Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const changeAdmin = async () => {
    try {
      const newAdminAddress = prompt('Enter new admin address:');
      
      if (!newAdminAddress) return;
      
      await userContract.methods.changeAdmin(newAdminAddress).send({ from: account });
      
      alert(`Admin changed to ${newAdminAddress}`);
    } catch (error) {
      console.error('Error changing admin:', error);
      alert(`Failed to change admin: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="card">
          <h2>Access Denied</h2>
          <p>{error}</p>
          <button className="btn" onClick={() => onLogout(true)}>Change Role</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header>
        <h1 className="header-title">Admin Dashboard</h1>
        <div className="account-info">
          <div className="account-address">{account}</div>
          <button 
            className="btn" 
            onClick={() => onLogout(true)} 
            style={{ marginRight: '10px' }}
          >
            Change Role
          </button>
          <button className="btn" onClick={() => onLogout(false)}>Logout</button>
        </div>
      </header>
      
      <div className="container">
        <div className="card">
          <h2>System Administration</h2>
          <p>You have admin privileges for this e-waste tracking system.</p>
          
          <div className="admin-actions" style={{ marginTop: '20px' }}>
            <button className="btn" onClick={changeAdmin}>Change Admin</button>
          </div>
        </div>
        
        <div className="card">
          <h2>Register New User</h2>
          <form onSubmit={registerUser}>
            <div className="form-control">
              <label>User Address</label>
              <input
                type="text"
                name="address"
                value={registerForm.address}
                onChange={handleInputChange}
                placeholder="0x..."
                required
              />
            </div>
            
            <div className="form-control">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={registerForm.name}
                onChange={handleInputChange}
                placeholder="User's name"
                required
              />
            </div>
            
            <div className="form-control">
              <label>Role</label>
              <select 
                name="role" 
                value={registerForm.role} 
                onChange={handleInputChange}
                required
              >
                <option value="0">Producer</option>
                <option value="1">Recycler</option>
                <option value="2">Logistics</option>
                <option value="3">Regulator</option>
              </select>
            </div>
            
            <div className="form-control">
              <label>Contact Information</label>
              <input
                type="text"
                name="contactInfo"
                value={registerForm.contactInfo}
                onChange={handleInputChange}
                placeholder="Email, phone, etc."
                required
              />
            </div>
            
            <button 
              className="btn btn-block" 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Register User'}
            </button>
          </form>
        </div>
        
        <div className="card">
          <h2>System Statistics</h2>
          <div className="stats-container" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div className="stat-box" style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px', width: '22%' }}>
              <h3>Total Users</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>-</p>
            </div>
            <div className="stat-box" style={{ background: '#e8f4ea', padding: '15px', borderRadius: '8px', width: '22%' }}>
              <h3>Producers</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>-</p>
            </div>
            <div className="stat-box" style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', width: '22%' }}>
              <h3>Recyclers</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>-</p>
            </div>
            <div className="stat-box" style={{ background: '#fff8e1', padding: '15px', borderRadius: '8px', width: '22%' }}>
              <h3>Waste Items</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>-</p>
            </div>
          </div>
          <p style={{ marginTop: '15px', color: '#666' }}>
            Note: These statistics are placeholders. In a production app, these would be populated from blockchain events.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;