import React, { useState, useEffect } from 'react';
import UserManagementABI from '../contracts/UserManagementABI.json';
import EWasteTrackingABI from '../contracts/EWasteTrackingABI.json';
import config from '../config';
import DashboardHeader from './DashboardHeader';
import ModalDialog from './ModalDialog';
import LoadingSpinner from './LoadingSpinner';

const LogisticsDashboard = ({ web3, account, onLogout }) => {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [wasteItems, setWasteItems] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [activeTab, setActiveTab] = useState('shipments');
  
  // Shipment form state
  const [shipmentForm, setShipmentForm] = useState({
    wasteId: '',
    producer: '',
    receiver: '',
    trackingCode: '',
    location: '',
    notes: ''
  });
  
  // Update form
  const [updateForm, setUpdateForm] = useState({
    shipmentId: '',
    status: '1', // Default: Picked Up
    location: '',
    notes: ''
  });
  
  // Contract instances
  const [userContract, setUserContract] = useState(null);
  const [wasteContract, setWasteContract] = useState(null);

  useEffect(() => {
    console.log("LogisticsDashboard mounted with props:", { web3, account });
    
    const initContracts = async () => {
      try {
        if (!web3) {
          console.error("Web3 instance not available");
          return;
        }
        
        console.log("Initializing contracts with Web3:", web3);
        
        // Get contract addresses from config
        const { userManagementAddress, eWasteTrackingAddress } = config.contracts;
        
        // Create contract instances
        const userManagementInstance = new web3.eth.Contract(
          UserManagementABI,
          userManagementAddress
        );
        
        const wasteContractInstance = new web3.eth.Contract(
          EWasteTrackingABI,
          eWasteTrackingAddress
        );
        
        setUserContract(userManagementInstance);
        setWasteContract(wasteContractInstance);
        
        // Get user details
        try {
          const result = await userManagementInstance.methods.getUserByRole(account, 'Logistics').call();
          setUserName(result[0]); // name from the returned tuple
          
          // Load waste items and simulated shipments
          loadAvailableWasteItems(wasteContractInstance);
          loadShipments();
          
        } catch (error) {
          console.error('Error fetching user details:', error);
          setError('You are not registered as Logistics. Please register first.');
        }
        
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

  // Load waste items ready for shipment (not processed)
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
              isProcessed: details.isProcessed
            };
          }
          return null;
        })
      );
      
      // Filter out null entries (processed waste)
      setWasteItems(wasteDetails.filter(item => item !== null));
    } catch (error) {
      console.error('Error loading waste items:', error);
    }
  };
  
  // Since we don't have a real LogisticsTracking contract connected yet,
  // this simulates loading shipments from localStorage
  const loadShipments = () => {
    try {
      const savedShipments = localStorage.getItem('shipments');
      if (savedShipments) {
        // Filter shipments for this logistics provider
        const parsedShipments = JSON.parse(savedShipments);
        const filteredShipments = parsedShipments.filter(
          shipment => shipment.transporter === account
        );
        setShipments(filteredShipments);
      }
    } catch (error) {
      console.error('Error loading shipments:', error);
    }
  };
  
  // Create new shipment
  const createShipment = (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const shipmentId = Date.now().toString(); // Use timestamp as unique ID
      const newShipment = {
        id: shipmentId,
        wasteId: shipmentForm.wasteId,
        status: 0, // 0: Pending
        transporter: account,
        location: shipmentForm.location || 'Origin',
        trackingCode: shipmentForm.trackingCode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        producer: shipmentForm.producer,
        receiver: shipmentForm.receiver,
        notes: shipmentForm.notes
      };
      
      // Save to localStorage (simulating blockchain)
      const savedShipments = localStorage.getItem('shipments');
      let allShipments = [];
      
      if (savedShipments) {
        allShipments = JSON.parse(savedShipments);
      }
      
      allShipments.push(newShipment);
      localStorage.setItem('shipments', JSON.stringify(allShipments));
      
      // Update state
      setShipments([...shipments, newShipment]);
      
      // Reset form
      setShipmentForm({
        wasteId: '',
        producer: '',
        receiver: '',
        trackingCode: '',
        location: '',
        notes: ''
      });
      
      alert('Shipment created successfully!');
    } catch (error) {
      console.error('Error creating shipment:', error);
      alert('Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };
  
  // Update shipment status
  const updateShipment = (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { shipmentId, status, location, notes } = updateForm;
      
      // Get current shipments
      const savedShipments = localStorage.getItem('shipments');
      if (!savedShipments) {
        throw new Error('No shipments found');
      }
      
      let allShipments = JSON.parse(savedShipments);
      
      // Find and update the specific shipment
      const updatedShipments = allShipments.map(shipment => {
        if (shipment.id === shipmentId) {
          return {
            ...shipment,
            status: parseInt(status),
            location: location,
            notes: notes,
            updatedAt: Date.now()
          };
        }
        return shipment;
      });
      
      // Save to localStorage
      localStorage.setItem('shipments', JSON.stringify(updatedShipments));
      
      // Update state - filter for this transporter's shipments
      const filteredShipments = updatedShipments.filter(
        shipment => shipment.transporter === account
      );
      setShipments(filteredShipments);
      
      // Reset form
      setUpdateForm({
        shipmentId: '',
        status: '1',
        location: '',
        notes: ''
      });
      
      alert('Shipment updated successfully!');
    } catch (error) {
      console.error('Error updating shipment:', error);
      alert('Failed to update shipment');
    } finally {
      setLoading(false);
    }
  };
  
  const handleShipmentFormChange = (e) => {
    const { name, value } = e.target;
    setShipmentForm({
      ...shipmentForm,
      [name]: value
    });
  };
  
  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm({
      ...updateForm,
      [name]: value
    });
  };
  
  const selectWaste = (wasteItem) => {
    setShipmentForm({
      ...shipmentForm,
      wasteId: wasteItem.id,
      producer: wasteItem.producer
    });
  };
  
  const selectShipment = (shipment) => {
    setUpdateForm({
      shipmentId: shipment.id,
      status: shipment.status.toString(),
      location: shipment.location,
      notes: shipment.notes || ''
    });
  };

  // Modal state for registration
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    message: '',
    fields: []
  });
  
  // Modal form state
  const [formValues, setFormValues] = useState({});
  
  const openRegistrationModal = () => {
    setModalData({
      title: 'Logistics Registration',
      message: 'Please provide your details to register as a Logistics Provider',
      fields: [
        { name: 'name', label: 'Your Name', type: 'text', value: '' },
        { name: 'contactInfo', label: 'Contact Information', type: 'text', value: '' }
      ]
    });
    setShowModal(true);
  };
  
  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };
  
  const handleModalSubmit = () => {
    registerAsLogistics(formValues);
  };
  
  const registerAsLogistics = async (formData) => {
    try {
      const { name, contactInfo } = formData;
      
      if (!name || !contactInfo) {
        setError('Name and contact information are required');
        return;
      }
      
      setLoading(true);
      
      await userContract.methods.registerUser(
        name,
        2, // Logistics role is 2 in enum
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
  
  // Helper function to render shipment status as text
  const renderStatus = (status) => {
    const statuses = ['Pending', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'];
    return statuses[status] || 'Unknown';
  };

  if (loading) {
    return <LoadingSpinner fullPage color="#e9c46a" />;
  }

  return (
    <div>
      <DashboardHeader
        title="Logistics Dashboard"
        icon="🚚"
        account={account}
        onChangeRole={() => onLogout(true)}
        onLogout={() => onLogout(false)}
        roleName="Logistics"
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
              <button className="btn" onClick={openRegistrationModal}>Register as Logistics</button>
            )}
          </div>
        ) : (
          <>
            <div className="card">
              <h2>Welcome, {userName || 'Logistics Provider'}</h2>
              <p>You can manage waste shipments and transportation here.</p>
              
              <div className="stats-container">
                <div className="stat-box stat-box-primary">
                  <h3>Total Shipments</h3>
                  <div className="stat-value">{shipments.length}</div>
                  <div className="stat-description">All shipments</div>
                </div>
                <div className="stat-box stat-box-warning">
                  <h3>Pending</h3>
                  <div className="stat-value">
                    {shipments.filter(s => s.status === 0).length}
                  </div>
                  <div className="stat-description">Awaiting pickup</div>
                </div>
                <div className="stat-box">
                  <h3>In Transit</h3>
                  <div className="stat-value">
                    {shipments.filter(s => s.status === 1 || s.status === 2).length}
                  </div>
                  <div className="stat-description">Currently moving</div>
                </div>
                <div className="stat-box stat-box-success">
                  <h3>Delivered</h3>
                  <div className="stat-value">
                    {shipments.filter(s => s.status === 3).length}
                  </div>
                  <div className="stat-description">Successfully delivered</div>
                </div>
              </div>
            </div>
            
            {/* Tab navigation */}
            <div className="tab-navigation">
              <button 
                className={`tab-button ${activeTab === 'shipments' ? 'active' : ''}`} 
                onClick={() => setActiveTab('shipments')}
              >
                Manage Shipments
              </button>
              <button 
                className={`tab-button ${activeTab === 'create' ? 'active' : ''}`} 
                onClick={() => setActiveTab('create')}
              >
                Create Shipment
              </button>
              <button 
                className={`tab-button ${activeTab === 'update' ? 'active' : ''}`} 
                onClick={() => setActiveTab('update')}
              >
                Update Status
              </button>
            </div>
            
            {/* Shipments Tab */}
            {activeTab === 'shipments' && (
              <div className="card">
                <h2>My Shipments</h2>
                {shipments.length === 0 ? (
                  <p>No shipments found. Create a new shipment to get started.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Waste ID</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th>Created</th>
                        <th>Updated</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map((shipment) => (
                        <tr key={shipment.id} style={{ borderBottom: '1px solid #ddd' }}>
                          <td>{shipment.id.substring(shipment.id.length - 6)}</td>
                          <td>{shipment.wasteId}</td>
                          <td>
                            <span className={`status-badge ${shipment.status === 3 ? 'status-success' : shipment.status === 4 ? 'status-error' : shipment.status === 0 ? 'status-pending' : 'status-info'}`}>
                              {renderStatus(shipment.status)}
                            </span>
                          </td>
                          <td>{shipment.location}</td>
                          <td>{new Date(shipment.createdAt).toLocaleString()}</td>
                          <td>{new Date(shipment.updatedAt).toLocaleString()}</td>
                          <td>
                            <button 
                              className="btn" 
                              onClick={() => {
                                selectShipment(shipment);
                                setActiveTab('update');
                              }}
                              style={{ padding: '5px 10px' }}
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            
            {/* Create Shipment Tab */}
            {activeTab === 'create' && (
              <div className="card">
                <h2>Create New Shipment</h2>
                <form onSubmit={createShipment}>
                  <div className="form-control">
                    <label>Waste Item</label>
                    <select
                      name="wasteId"
                      value={shipmentForm.wasteId}
                      onChange={handleShipmentFormChange}
                      required
                    >
                      <option value="">Select waste item</option>
                      {wasteItems.map(item => (
                        <option key={item.id} value={item.id}>
                          ID: {item.id} - {item.wasteType} ({item.origin})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label>Producer Address</label>
                    <input
                      type="text"
                      name="producer"
                      value={shipmentForm.producer}
                      onChange={handleShipmentFormChange}
                      placeholder="0x..."
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label>Receiver Address (Recycler)</label>
                    <input
                      type="text"
                      name="receiver"
                      value={shipmentForm.receiver}
                      onChange={handleShipmentFormChange}
                      placeholder="0x..."
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label>Tracking Code</label>
                    <input
                      type="text"
                      name="trackingCode"
                      value={shipmentForm.trackingCode}
                      onChange={handleShipmentFormChange}
                      placeholder="e.g., TRK-12345"
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label>Pickup Location</label>
                    <input
                      type="text"
                      name="location"
                      value={shipmentForm.location}
                      onChange={handleShipmentFormChange}
                      placeholder="e.g., Warehouse A"
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      value={shipmentForm.notes}
                      onChange={handleShipmentFormChange}
                      placeholder="Additional information"
                      rows="3"
                    />
                  </div>
                  
                  <button 
                    className="btn btn-block" 
                    type="submit" 
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Create Shipment'}
                  </button>
                </form>
                
                <div style={{ marginTop: '20px' }}>
                  <h3>Available Waste Items</h3>
                  {wasteItems.length === 0 ? (
                    <p>No available waste items found.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Type</th>
                          <th>Origin</th>
                          <th>Quantity</th>
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
                            <td>
                              <button 
                                className="btn" 
                                onClick={() => selectWaste(item)}
                                style={{ padding: '5px 10px' }}
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            
            {/* Update Status Tab */}
            {activeTab === 'update' && (
              <div className="card">
                <h2>Update Shipment Status</h2>
                {updateForm.shipmentId ? (
                  <form onSubmit={updateShipment}>
                    <div className="form-control">
                      <label>Shipment ID</label>
                      <input
                        type="text"
                        value={updateForm.shipmentId}
                        readOnly
                        style={{ backgroundColor: '#f0f0f0' }}
                      />
                    </div>
                    
                    <div className="form-control">
                      <label>Status</label>
                      <select
                        name="status"
                        value={updateForm.status}
                        onChange={handleUpdateFormChange}
                        required
                      >
                        <option value="0">Pending</option>
                        <option value="1">Picked Up</option>
                        <option value="2">In Transit</option>
                        <option value="3">Delivered</option>
                        <option value="4">Cancelled</option>
                      </select>
                    </div>
                    
                    <div className="form-control">
                      <label>Current Location</label>
                      <input
                        type="text"
                        name="location"
                        value={updateForm.location}
                        onChange={handleUpdateFormChange}
                        placeholder="e.g., Distribution Center B"
                        required
                      />
                    </div>
                    
                    <div className="form-control">
                      <label>Notes</label>
                      <textarea
                        name="notes"
                        value={updateForm.notes}
                        onChange={handleUpdateFormChange}
                        placeholder="Additional information or updates"
                        rows="3"
                      />
                    </div>
                    
                    <button 
                      className="btn btn-block" 
                      type="submit" 
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Update Status'}
                    </button>
                  </form>
                ) : (
                  <p>
                    Select a shipment from the Shipments tab to update its status.
                    <br />
                    <button 
                      className="btn" 
                      onClick={() => setActiveTab('shipments')}
                      style={{ marginTop: '15px' }}
                    >
                      Go to Shipments
                    </button>
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LogisticsDashboard;