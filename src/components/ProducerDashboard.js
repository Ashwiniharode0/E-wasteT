import React, { useState, useEffect } from 'react';
import UserManagementABI from '../contracts/UserManagementABI.json';
import EWasteTrackingABI from '../contracts/EWasteTrackingABI.json';
import config from '../config';
import DashboardHeader from './DashboardHeader';
import ModalDialog from './ModalDialog';
import LoadingSpinner from './LoadingSpinner';

const ProducerDashboard = ({ web3, account, onLogout }) => {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wasteItems, setWasteItems] = useState([]);
  
  // Form state for logging waste
  const [wasteForm, setWasteForm] = useState({
    wasteType: '',
    origin: '',
    quantity: '',
    description: '',
    imageHash: '', // Would be IPFS hash in a production app
    deadline: ''
  });
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    message: '',
    fields: []
  });
  
  // Modal form state
  const [formValues, setFormValues] = useState({});
  
  // Waste stats
  const [wasteStats, setWasteStats] = useState({
    total: 0,
    processed: 0,
    pending: 0
  });

  // Contract instances
  const [userContract, setUserContract] = useState(null);
  const [wasteContract, setWasteContract] = useState(null);

  useEffect(() => {
    console.log("ProducerDashboard mounted with props:", { web3, account });
    
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
          const result = await userManagementInstance.methods.getUserByRole(account, 'Producer').call();
          setUserName(result[0]); // name from the returned tuple
        } catch (error) {
          console.error('Error fetching user details:', error);
          setError('You are not registered as a Producer. Please register first.');
        }
        
        // Load waste items logged by this producer
        loadProducerWasteItems(ewasteTrackingInstance);
        
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

  // Helper function to get image from localStorage
  const getImageFromHash = (hash) => {
    if (!hash || !hash.startsWith('img_')) return null;
    
    try {
      const savedImages = JSON.parse(localStorage.getItem('wasteImages') || '{}');
      return savedImages[hash] || null;
    } catch (error) {
      console.error('Error retrieving image:', error);
      return null;
    }
  };

  const loadProducerWasteItems = async (wasteContractInstance) => {
    try {
      // Get waste IDs for this producer
      const wasteIds = await wasteContractInstance.methods.getWasteItemsByProducer(account).call();
      
      // Get details for each waste item
      const wasteDetails = await Promise.all(
        wasteIds.map(async (id) => {
          const details = await wasteContractInstance.methods.getWasteItem(id).call();
          
          // Get image URL if it's a local hash
          const imageUrl = getImageFromHash(details.imageHash);
          
          return {
            id: details.id,
            wasteType: details.wasteType,
            origin: details.origin,
            quantity: details.quantity,
            description: details.description,
            imageHash: details.imageHash,
            imageUrl: imageUrl, // Add image URL if available
            deadline: new Date(details.deadline * 1000).toLocaleString(),
            loggedAt: new Date(details.loggedAt * 1000).toLocaleString(),
            producer: details.producer,
            isProcessed: details.isProcessed
          };
        })
      );
      
      setWasteItems(wasteDetails);
      
      // Update waste statistics
      const total = wasteDetails.length;
      const processed = wasteDetails.filter(item => item.isProcessed).length;
      const pending = total - processed;
      
      setWasteStats({
        total,
        processed,
        pending
      });
      
    } catch (error) {
      console.error('Error loading waste items:', error);
      setError('Failed to load waste items. Please check your connection.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWasteForm({
      ...wasteForm,
      [name]: value
    });
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please select a smaller image.');
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        alert('Only image files are allowed.');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setPreviewUrl(loadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const uploadImage = async () => {
    if (!selectedImage) return null;
    
    setImageUploading(true);
    
    try {
      // In a real app with IPFS, we would upload to IPFS here
      // For this demo, we'll simulate by creating a local object URL 
      // and saving a reference in localStorage
      
      // Generate a simple hash (not cryptographically secure)
      const simpleHash = `img_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      
      // Store image in localStorage (this is just for demo purposes)
      // In a real app, you would store this in IPFS or a database
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        try {
          // Store images in localStorage
          const savedImages = JSON.parse(localStorage.getItem('wasteImages') || '{}');
          savedImages[simpleHash] = loadEvent.target.result;
          localStorage.setItem('wasteImages', JSON.stringify(savedImages));
        } catch (error) {
          console.error('Error storing image:', error);
        }
      };
      reader.readAsDataURL(selectedImage);
      
      return simpleHash;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Upload image first if one is selected
      let imageHash = wasteForm.imageHash;
      
      if (selectedImage) {
        const uploadedHash = await uploadImage();
        if (uploadedHash) {
          imageHash = uploadedHash;
        }
      }
      
      // Calculate deadline timestamp from days
      const deadlineDays = parseInt(wasteForm.deadline);
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadlineDays * 24 * 60 * 60);
      
      await wasteContract.methods.logWaste(
        wasteForm.wasteType,
        wasteForm.origin,
        web3.utils.toWei(wasteForm.quantity, 'ether'), // Convert to wei for quantity
        wasteForm.description,
        imageHash,
        deadlineTimestamp
      ).send({ from: account });
      
      // Reload waste items
      await loadProducerWasteItems(wasteContract);
      
      // Reset form and image
      setWasteForm({
        wasteType: '',
        origin: '',
        quantity: '',
        description: '',
        imageHash: '',
        deadline: ''
      });
      setSelectedImage(null);
      setPreviewUrl('');
      
      alert('Waste logged successfully!');
    } catch (error) {
      console.error('Error logging waste:', error);
      setError(error.message || 'Failed to log waste');
    } finally {
      setLoading(false);
    }
  };

  const openRegistrationModal = () => {
    setModalData({
      title: 'Producer Registration',
      message: 'Please provide your details to register as a Producer',
      fields: [
        { name: 'name', label: 'Your Name', type: 'text', value: '' },
        { name: 'contactInfo', label: 'Contact Information', type: 'text', value: '' }
      ]
    });
    setShowModal(true);
  };
  
  const registerAsProducer = async (formData) => {
    try {
      const { name, contactInfo } = formData;
      
      if (!name || !contactInfo) {
        setError('Name and contact information are required');
        return;
      }
      
      setLoading(true);
      
      await userContract.methods.registerUser(
        name,
        0, // Producer role is 0 in enum
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
    registerAsProducer(formValues);
  };
  
  if (loading) {
    return <LoadingSpinner fullPage color="#264653" />;
  }

  return (
    <div>
      <DashboardHeader
        title="Producer Dashboard"
        icon="🏭"
        account={account}
        onChangeRole={() => onLogout(true)}
        onLogout={() => onLogout(false)}
        roleName="Producer"
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
              <button className="btn" onClick={openRegistrationModal}>Register as Producer</button>
            )}
          </div>
        ) : (
          <>
            <div className="card">
              <h2>Welcome, {userName || 'Producer'}</h2>
              <p>You can log electronic waste items using the form below.</p>
              
              <div className="stats-container">
                <div className="stat-box stat-box-primary">
                  <h3>Total Waste Items</h3>
                  <div className="stat-value">{wasteStats.total}</div>
                  <div className="stat-description">Total items logged</div>
                </div>
                <div className="stat-box stat-box-success">
                  <h3>Processed Items</h3>
                  <div className="stat-value">{wasteStats.processed}</div>
                  <div className="stat-description">Items fully processed</div>
                </div>
                <div className="stat-box stat-box-warning">
                  <h3>Pending Items</h3>
                  <div className="stat-value">{wasteStats.pending}</div>
                  <div className="stat-description">Items awaiting processing</div>
                </div>
              </div>
            </div>
            
            <div className="card">
              <h2>Log New E-Waste</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-control">
                  <label>Waste Type</label>
                  <input
                    type="text"
                    name="wasteType"
                    value={wasteForm.wasteType}
                    onChange={handleInputChange}
                    placeholder="e.g., Electronics, Batteries"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label>Origin</label>
                  <input
                    type="text"
                    name="origin"
                    value={wasteForm.origin}
                    onChange={handleInputChange}
                    placeholder="e.g., Manufacturing Plant A"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label>Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={wasteForm.quantity}
                    onChange={handleInputChange}
                    placeholder="Quantity in units"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={wasteForm.description}
                    onChange={handleInputChange}
                    placeholder="Detailed description of the waste"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label>Image Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ marginBottom: '10px' }}
                  />
                  {previewUrl && (
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                      <img 
                        src={previewUrl} 
                        alt="Waste preview" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '200px', 
                          borderRadius: '8px',
                          border: '1px solid #ddd'
                        }} 
                      />
                    </div>
                  )}
                  {imageUploading && <p>Uploading image...</p>}
                </div>
                
                <div className="form-control">
                  <label>Image Hash (Manual Entry - Optional)</label>
                  <input
                    type="text"
                    name="imageHash"
                    value={wasteForm.imageHash}
                    onChange={handleInputChange}
                    placeholder="Only required if you have an existing hash"
                  />
                  <small style={{ color: '#777' }}>
                    Leave empty if uploading a new image
                  </small>
                </div>
                
                <div className="form-control">
                  <label>Deadline (days from now)</label>
                  <input
                    type="number"
                    name="deadline"
                    value={wasteForm.deadline}
                    onChange={handleInputChange}
                    placeholder="e.g., 30 days"
                    required
                  />
                </div>
                
                <button className="btn btn-block" type="submit" disabled={loading}>
                  {loading ? 'Processing...' : 'Log Waste'}
                </button>
              </form>
            </div>
            
            <div className="card">
              <h2>My Logged Waste Items</h2>
              {wasteItems.length === 0 ? (
                <p>No waste items logged yet.</p>
              ) : (
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Image</th>
                        <th>Type</th>
                        <th>Origin</th>
                        <th>Quantity</th>
                        <th>Date Logged</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wasteItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                          <td>{item.id}</td>
                          <td>
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt="Waste" 
                                className="image-thumbnail"
                                onClick={() => window.open(item.imageUrl, '_blank')}
                              />
                            ) : (
                              <div 
                                style={{ 
                                  width: '60px', 
                                  height: '60px', 
                                  backgroundColor: '#f0f0f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  color: '#777',
                                  borderRadius: '4px'
                                }}
                              >
                                No Image
                              </div>
                            )}
                          </td>
                          <td>{item.wasteType}</td>
                          <td>{item.origin}</td>
                          <td>{web3.utils.fromWei(item.quantity.toString(), 'ether')}</td>
                          <td>{item.loggedAt}</td>
                          <td>{item.deadline}</td>
                          <td>
                            <span className={`status-badge ${item.isProcessed ? 'status-success' : 'status-pending'}`}>
                              {item.isProcessed ? 'Processed' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn"
                              style={{ padding: '5px 10px' }}
                              onClick={() => alert(`Description: ${item.description}`)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProducerDashboard;