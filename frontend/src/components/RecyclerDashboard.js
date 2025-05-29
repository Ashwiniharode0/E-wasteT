import React, { useState, useEffect } from 'react';
import UserManagementABI from '../contracts/UserManagementABI.json';
import EWasteTrackingABI from '../contracts/EWasteTrackingABI.json';
import config from '../config';
import DashboardHeader from './DashboardHeader';
import ModalDialog from './ModalDialog';
import LoadingSpinner from './LoadingSpinner';

const RecyclerDashboard = ({ web3, account, onLogout }) => {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wasteItems, setWasteItems] = useState([]);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    message: '',
    fields: []
  });
  
  // Modal form state
  const [formValues, setFormValues] = useState({});
  
  // Recycling method state
  const [recyclingMethod, setRecyclingMethod] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processed: 0
  });
  
  // Processed items
  const [processedItems, setProcessedItems] = useState([]);
  
  // Contract instances
  const [userContract, setUserContract] = useState(null);
  const [wasteContract, setWasteContract] = useState(null);

  useEffect(() => {
    console.log("RecyclerDashboard mounted with props:", { web3, account });
    
    const initContracts = async () => {
      try {
        if (!web3) {
          console.error("Web3 instance not available");
          return;
        }
        
        console.log("Initializing contracts with Web3:", web3);
        
        // Get contract addresses from config
        const { userManagementAddress, eWasteTrackingAddress } = config.contracts;
        console.log("Contract addresses:", { userManagementAddress, eWasteTrackingAddress });
        
        // Create contract instances
        const userManagementInstance = new web3.eth.Contract(
          UserManagementABI,
          userManagementAddress
        );
        
        const ewasteTrackingInstance = new web3.eth.Contract(
          EWasteTrackingABI,
          eWasteTrackingAddress
        );
        
        console.log("Contract instances created:", { 
          userManagementInstance, 
          ewasteTrackingInstance 
        });
        
        setUserContract(userManagementInstance);
        setWasteContract(ewasteTrackingInstance);
        
        // Get user details
        try {
          const result = await userManagementInstance.methods.getUserByRole(account, 'Recycler').call();
          setUserName(result[0]); // name from the returned tuple
        } catch (error) {
          console.error('Error fetching user details:', error);
          setError('You are not registered as a Recycler. Please register first.');
        }
        
        // Load waste items for processing
        loadAvailableWasteItems(ewasteTrackingInstance);
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing contracts:', error);
        setError(error.message || 'Failed to connect to blockchain');
        setLoading(false);
      }
    };
    
    if (web3 && account) {
      initContracts();
    }
  }, [web3, account]);

  const loadAvailableWasteItems = async (wasteContractInstance) => {
    try {
      // Get all waste IDs
      const wasteIds = await wasteContractInstance.methods.getAllWasteItems().call();
      
      // Get details for each waste item that is not processed
      const wasteDetails = await Promise.all(
        wasteIds.map(async (id) => {
          const details = await wasteContractInstance.methods.getWasteItem(id).call();
          // Only return unprocessed items
          if (!details.isProcessed) {
            return {
              id: details.id,
              wasteType: details.wasteType,
              origin: details.origin,
              quantity: details.quantity,
              description: details.description,
              imageHash: details.imageHash,
              deadline: new Date(details.deadline * 1000).toLocaleString(),
              loggedAt: new Date(details.loggedAt * 1000).toLocaleString(),
              producer: details.producer,
              isProcessed: details.isProcessed,
              recyclingMethod: details.recyclingMethod || ''
            };
          }
          return null;
        })
      );
      
      // Filter out null entries (processed waste)
      const filteredItems = wasteDetails.filter(item => item !== null);
      setWasteItems(filteredItems);
      
      // Update stats and processed items
      const allItems = await Promise.all(
        wasteIds.map(async (id) => {
          const details = await wasteContractInstance.methods.getWasteItem(id).call();
          return {
            id: details.id,
            wasteType: details.wasteType,
            origin: details.origin,
            quantity: details.quantity,
            isProcessed: details.isProcessed,
            recyclingMethod: details.recyclingMethod || ''
          };
        })
      );
      
      // Set processed items for display
      const processed = allItems.filter(item => item.isProcessed);
      setProcessedItems(processed);
      
      setStats({
        total: allItems.length,
        processed: processed.length,
        pending: allItems.filter(item => !item.isProcessed).length
      });
    } catch (error) {
      console.error('Error loading waste items:', error);
    }
  };

  const openRecyclingModal = (wasteId) => {
    setRecyclingMethod('');
    setModalData({
      title: 'Process Waste Item',
      message: 'Please specify how this item will be recycled:',
      fields: [
        { name: 'recyclingMethod', label: 'Recycling Method', type: 'text', value: '' }
      ],
      wasteId: wasteId
    });
    setShowModal(true);
  };

  const markAsProcessed = async (wasteId, method) => {
    try {
      if (!method || method.trim() === '') {
        alert('Please specify how the item was recycled');
        return;
      }
      
      setLoading(true);
      await wasteContract.methods.markAsProcessed(wasteId, method).send({ from: account });
      // Reload waste items after marking as processed
      await loadAvailableWasteItems(wasteContract);
      setLoading(false);
      alert('Waste item marked as processed successfully!');
    } catch (error) {
      console.error('Error marking waste as processed:', error);
      setError(error.message || 'Failed to process waste');
      setLoading(false);
    }
  };

  const openRegistrationModal = () => {
    setModalData({
      title: 'Recycler Registration',
      message: 'Please provide your details to register as a Recycler',
      fields: [
        { name: 'name', label: 'Your Name', type: 'text', value: '' },
        { name: 'contactInfo', label: 'Contact Information', type: 'text', value: '' }
      ]
    });
    setShowModal(true);
  };
  
  const registerAsRecycler = async (formData) => {
    try {
      const { name, contactInfo } = formData;
      
      if (!name || !contactInfo) {
        setError('Name and contact information are required');
        return;
      }
      
      setLoading(true);
      
      await userContract.methods.registerUser(
        name,
        1, // Recycler role is 1 in enum
        contactInfo
      ).send({ from: account });
      
      setUserName(name);
      setError('');
      setShowModal(false);
    } catch (error) {
      console.error('Error registering user:', error);
      setError(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle modal form changes and submission
  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };
  
  const handleModalSubmit = () => {
    if (modalData.title === 'Recycler Registration') {
      registerAsRecycler(formValues);
    } else if (modalData.title === 'Process Waste Item') {
      const method = formValues.recyclingMethod || '';
      markAsProcessed(modalData.wasteId, method);
      setFormValues({});
      setShowModal(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage color="#2a9d8f" />;
  }

  return (
    <div>
      <DashboardHeader
        title="Recycler Dashboard"
        icon="♻️"
        account={account}
        onChangeRole={() => onLogout(true)}
        onLogout={() => onLogout(false)}
        roleName="Recycler"
      />
      
      {/* Registration Modal */}
      <ModalDialog
        isOpen={showModal}
        title={modalData.title}
        message={modalData.message}
        onClose={() => setShowModal(false)}
        primaryAction={handleModalSubmit}
        primaryLabel="Register"
        secondaryAction={() => setShowModal(false)}
      >
        {modalData.fields && modalData.fields.map((field) => (
          <div className="form-control" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              type={field.type || 'text'}
              id={field.name}
              name={field.name}
              value={formValues[field.name] || ''}
              onChange={handleModalInputChange}
              required
            />
          </div>
        ))}
      </ModalDialog>
      
      <div className="container">
        {error ? (
          <div className="card">
            <h2>Error</h2>
            <p>{error}</p>
            {error.includes('not registered') && (
              <button className="btn" onClick={openRegistrationModal}>Register as Recycler</button>
            )}
          </div>
        ) : (
          <>
            <div className="card">
              <h2>Welcome, {userName || 'Recycler'}</h2>
              <p>You can process electronic waste items from the list below.</p>
              
              <div className="stats-container">
                <div className="stat-box stat-box-primary">
                  <h3>Total Waste Items</h3>
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-description">Total items in system</div>
                </div>
                <div className="stat-box stat-box-success">
                  <h3>Processed Items</h3>
                  <div className="stat-value">{stats.processed}</div>
                  <div className="stat-description">Items fully processed</div>
                </div>
                <div className="stat-box stat-box-warning">
                  <h3>Pending Items</h3>
                  <div className="stat-value">{stats.pending}</div>
                  <div className="stat-description">Items awaiting processing</div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <h2>Available E-Waste for Processing</h2>
              {wasteItems.length === 0 ? (
                <p>No waste items available for processing.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Origin</th>
                      <th>Quantity</th>
                      <th>Date Logged</th>
                      <th>Deadline</th>
                      <th>Producer</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteItems.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td>{item.id}</td>
                        <td>{item.wasteType}</td>
                        <td>{item.origin}</td>
                        <td>{web3.utils.fromWei(item.quantity.toString(), 'ether')}</td>
                        <td>{item.loggedAt}</td>
                        <td>{item.deadline}</td>
                        <td>
                          <div className="account-address">{`${item.producer.slice(0, 6)}...${item.producer.slice(-4)}`}</div>
                        </td>
                        <td>
                          <button 
                            className="btn btn-success" 
                            onClick={() => openRecyclingModal(item.id)}
                            disabled={loading}
                          >
                            <span role="img" aria-label="process">✅</span> Process
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="card">
              <h2>Processed E-Waste Items</h2>
              {processedItems.length === 0 ? (
                <p>No items have been processed yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Origin</th>
                      <th>Quantity</th>
                      <th>Recycling Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedItems.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td>{item.id}</td>
                        <td>{item.wasteType}</td>
                        <td>{item.origin}</td>
                        <td>{web3.utils.fromWei(item.quantity.toString(), 'ether')}</td>
                        <td>{item.recyclingMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecyclerDashboard;