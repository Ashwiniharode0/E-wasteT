import React, { useState, useEffect } from 'react';
import UserManagementABI from '../contracts/UserManagementABI.json';
import EWasteTrackingABI from '../contracts/EWasteTrackingABI.json';
import config from '../config';
import DashboardHeader from './DashboardHeader';
import ModalDialog from './ModalDialog';
import LoadingSpinner from './LoadingSpinner';

const RegulatorDashboard = ({ web3, account, onLogout }) => {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wasteItems, setWasteItems] = useState([]);
  const [audits, setAudits] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [nonCompliances, setNonCompliances] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Audit form state
  const [auditForm, setAuditForm] = useState({
    wasteId: '',
    status: 'Compliant', // Default: Compliant
    details: '',
    evidence: ''
  });
  
  // Certificate form state
  const [certificateForm, setCertificateForm] = useState({
    wasteId: '',
    recipientAddress: '',
    certificateType: 'Recycling',
    details: ''
  });
  
  // View waste details
  const [selectedWaste, setSelectedWaste] = useState(null);
  
  // Contract instances
  const [userContract, setUserContract] = useState(null);
  const [wasteContract, setWasteContract] = useState(null);

  useEffect(() => {
    console.log("RegulatorDashboard mounted with props:", { web3, account });
    
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
        
        setUserContract(userManagementInstance);
        setWasteContract(ewasteTrackingInstance);
        
        // Get user details
        try {
          const result = await userManagementInstance.methods.getUserByRole(account, 'Regulator').call();
          setUserName(result[0]); // name from the returned tuple
        } catch (error) {
          console.error('Error fetching user details:', error);
          setError('You are not registered as a Regulator. Please register first.');
        }
        
        // Load all waste items for compliance monitoring
        loadAllWasteItems(ewasteTrackingInstance);
        
        // Load audit data (using localStorage for demo)
        loadAuditData();
        
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
  
  // Load audit data from localStorage (simulating blockchain storage)
  const loadAuditData = () => {
    try {
      // Load audits
      const savedAudits = localStorage.getItem('audits');
      if (savedAudits) {
        setAudits(JSON.parse(savedAudits));
      }
      
      // Load certificates
      const savedCertificates = localStorage.getItem('certificates');
      if (savedCertificates) {
        setCertificates(JSON.parse(savedCertificates));
      }
      
      // Load non-compliances
      const savedNonCompliances = localStorage.getItem('nonCompliances');
      if (savedNonCompliances) {
        setNonCompliances(JSON.parse(savedNonCompliances));
      }
    } catch (error) {
      console.error('Error loading audit data:', error);
    }
  };

  const loadAllWasteItems = async (wasteContractInstance) => {
    try {
      // Get all waste IDs
      const wasteIds = await wasteContractInstance.methods.getAllWasteItems().call();
      
      // Get details for each waste item
      const wasteDetails = await Promise.all(
        wasteIds.map(async (id) => {
          const details = await wasteContractInstance.methods.getWasteItem(id).call();
          return {
            id: details.id,
            wasteType: details.wasteType,
            origin: details.origin,
            quantity: details.quantity,
            deadline: new Date(details.deadline * 1000).toLocaleString(),
            loggedAt: new Date(details.loggedAt * 1000).toLocaleString(),
            producer: details.producer,
            isProcessed: details.isProcessed
          };
        })
      );
      
      setWasteItems(wasteDetails);
    } catch (error) {
      console.error('Error loading waste items:', error);
    }
  };

  // Helper function to get image from localStorage (for waste items with images)
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
  
  // Handle viewing a waste item's details
  const viewWasteDetails = async (wasteId) => {
    try {
      setLoading(true);
      
      // Find waste item in our state first (to avoid duplicate calls)
      const existingItem = wasteItems.find(item => item.id === wasteId);
      
      if (existingItem) {
        // Get image from localStorage if available
        const imageUrl = getImageFromHash(existingItem.imageHash);
        setSelectedWaste({
          ...existingItem,
          imageUrl
        });
      } else {
        // Fetch from blockchain if not in state
        const details = await wasteContract.methods.getWasteItem(wasteId).call();
        const imageUrl = getImageFromHash(details.imageHash);
        
        setSelectedWaste({
          id: details.id,
          wasteType: details.wasteType,
          origin: details.origin,
          quantity: details.quantity,
          description: details.description,
          imageHash: details.imageHash,
          imageUrl,
          deadline: new Date(details.deadline * 1000).toLocaleString(),
          loggedAt: new Date(details.loggedAt * 1000).toLocaleString(),
          producer: details.producer,
          isProcessed: details.isProcessed
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching waste details:', error);
      setLoading(false);
    }
  };
  
  // Handle audit form input changes
  const handleAuditFormChange = (e) => {
    const { name, value } = e.target;
    setAuditForm({
      ...auditForm,
      [name]: value
    });
  };
  
  // Handle certificate form input changes
  const handleCertificateFormChange = (e) => {
    const { name, value } = e.target;
    setCertificateForm({
      ...certificateForm,
      [name]: value
    });
  };
  
  // Create a new audit
  const createAudit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const newAudit = {
        id: `audit_${Date.now()}`,
        wasteId: auditForm.wasteId,
        status: auditForm.status,
        details: auditForm.details,
        evidence: auditForm.evidence,
        auditor: account,
        auditedAt: Date.now()
      };
      
      // Check if this is a non-compliance
      if (auditForm.status === 'NonCompliant') {
        const wasteItem = wasteItems.find(item => item.id === auditForm.wasteId);
        
        // Create non-compliance record
        const newNonCompliance = {
          id: `nc_${Date.now()}`,
          wasteId: auditForm.wasteId,
          details: auditForm.details,
          responsible: wasteItem ? wasteItem.producer : 'Unknown',
          reportedBy: account,
          reportedAt: Date.now(),
          status: 'Open'
        };
        
        // Save non-compliance
        const savedNonCompliances = localStorage.getItem('nonCompliances');
        let allNonCompliances = [];
        
        if (savedNonCompliances) {
          allNonCompliances = JSON.parse(savedNonCompliances);
        }
        
        allNonCompliances.push(newNonCompliance);
        localStorage.setItem('nonCompliances', JSON.stringify(allNonCompliances));
        setNonCompliances(allNonCompliances);
      }
      
      // Save audit
      const savedAudits = localStorage.getItem('audits');
      let allAudits = [];
      
      if (savedAudits) {
        allAudits = JSON.parse(savedAudits);
      }
      
      allAudits.push(newAudit);
      localStorage.setItem('audits', JSON.stringify(allAudits));
      
      // Update state
      setAudits(allAudits);
      
      // Reset form
      setAuditForm({
        wasteId: '',
        status: 'Compliant',
        details: '',
        evidence: ''
      });
      
      alert('Audit created successfully!');
    } catch (error) {
      console.error('Error creating audit:', error);
      alert('Failed to create audit');
    } finally {
      setLoading(false);
    }
  };
  
  // Issue a compliance certificate
  const issueCertificate = (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Check if waste item exists and is processed
      const wasteItem = wasteItems.find(item => item.id === certificateForm.wasteId);
      
      if (!wasteItem) {
        alert('Waste item not found!');
        setLoading(false);
        return;
      }
      
      if (!wasteItem.isProcessed) {
        alert('Cannot issue certificate: waste item not yet processed');
        setLoading(false);
        return;
      }
      
      // Check if waste has a compliant audit
      const hasCompliantAudit = audits.some(
        audit => audit.wasteId === certificateForm.wasteId && audit.status === 'Compliant'
      );
      
      if (!hasCompliantAudit) {
        alert('Cannot issue certificate: no compliant audit record exists');
        setLoading(false);
        return;
      }
      
      // Create certificate
      const newCertificate = {
        id: `cert_${Date.now()}`,
        wasteId: certificateForm.wasteId,
        certificateType: certificateForm.certificateType,
        details: certificateForm.details,
        recipient: certificateForm.recipientAddress,
        issuer: account,
        issuedAt: Date.now()
      };
      
      // Save certificate
      const savedCertificates = localStorage.getItem('certificates');
      let allCertificates = [];
      
      if (savedCertificates) {
        allCertificates = JSON.parse(savedCertificates);
      }
      
      allCertificates.push(newCertificate);
      localStorage.setItem('certificates', JSON.stringify(allCertificates));
      
      // Update state
      setCertificates(allCertificates);
      
      // Reset form
      setCertificateForm({
        wasteId: '',
        recipientAddress: '',
        certificateType: 'Recycling',
        details: ''
      });
      
      alert('Certificate issued successfully!');
    } catch (error) {
      console.error('Error issuing certificate:', error);
      alert('Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };
  
  // Register as a Regulator
  // Modal state for registration
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationFormValues, setRegistrationFormValues] = useState({});
  
  const openRegistrationModal = () => {
    setShowRegistrationModal(true);
  };
  
  const handleRegistrationInputChange = (e) => {
    const { name, value } = e.target;
    setRegistrationFormValues({
      ...registrationFormValues,
      [name]: value
    });
  };
  
  const handleRegistrationSubmit = () => {
    registerAsRegulator(registrationFormValues);
  };
  
  const registerAsRegulator = async (formData) => {
    try {
      const { name, contactInfo } = formData;
      
      if (!name || !contactInfo) {
        setError('Name and contact information are required');
        return;
      }
      
      setLoading(true);
      
      await userContract.methods.registerUser(
        name,
        3, // Regulator role is 3 in enum
        contactInfo
      ).send({ from: account });
      
      setUserName(name);
      setError('');
      setShowRegistrationModal(false);
    } catch (error) {
      console.error('Error registering user:', error);
      setError(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage color="#f4a261" />;
  }

  return (
    <div>
      <DashboardHeader
        title="Regulator Dashboard"
        icon="📋"
        account={account}
        onChangeRole={() => onLogout(true)}
        onLogout={() => onLogout(false)}
        roleName="Regulator"
      />
      
      {/* Registration Modal */}
      <ModalDialog
        isOpen={showRegistrationModal}
        title="Regulator Registration"
        message="Please provide your details to register as a Regulator"
        onClose={() => setShowRegistrationModal(false)}
        primaryAction={handleRegistrationSubmit}
        primaryLabel="Register"
        secondaryAction={() => setShowRegistrationModal(false)}
      >
        <div className="form-control">
          <label htmlFor="name">Your Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={registrationFormValues.name || ''}
            onChange={handleRegistrationInputChange}
            required
          />
        </div>
        <div className="form-control">
          <label htmlFor="contactInfo">Contact Information</label>
          <input
            type="text"
            id="contactInfo"
            name="contactInfo"
            value={registrationFormValues.contactInfo || ''}
            onChange={handleRegistrationInputChange}
            required
          />
        </div>
      </ModalDialog>
      
      <div className="container">
        {error ? (
          <div className="card">
            <h2>Error</h2>
            <p>{error}</p>
            {error.includes('not registered') && (
              <button className="btn" onClick={openRegistrationModal}>Register as Regulator</button>
            )}
          </div>
        ) : (
          <>
            <div className="card">
              <h2>Welcome, {userName || 'Regulator'}</h2>
              <p>You can monitor and audit e-waste compliance in this dashboard.</p>
              
              <div className="stats-container">
                <div className="stat-box stat-box-primary">
                  <h3>Total Waste Items</h3>
                  <div className="stat-value">{wasteItems.length}</div>
                  <div className="stat-description">All items in system</div>
                </div>
                <div className="stat-box stat-box-success">
                  <h3>Processed Items</h3>
                  <div className="stat-value">
                    {wasteItems.filter(item => item.isProcessed).length}
                  </div>
                  <div className="stat-description">Items fully processed</div>
                </div>
                <div className="stat-box stat-box-info">
                  <h3>Audits</h3>
                  <div className="stat-value">{audits.length}</div>
                  <div className="stat-description">Total audit records</div>
                </div>
                <div className="stat-box stat-box-error">
                  <h3>Non-Compliances</h3>
                  <div className="stat-value">{nonCompliances.length}</div>
                  <div className="stat-description">Compliance issues</div>
                </div>
              </div>
            </div>
            
            {/* Tab navigation */}
            <div className="tab-navigation">
              <button 
                className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`} 
                onClick={() => setActiveTab('overview')}
              >
                Waste Overview
              </button>
              <button 
                className={`tab-button ${activeTab === 'audit' ? 'active' : ''}`} 
                onClick={() => setActiveTab('audit')}
              >
                Perform Audit
              </button>
              <button 
                className={`tab-button ${activeTab === 'certificates' ? 'active' : ''}`} 
                onClick={() => setActiveTab('certificates')}
              >
                Certificates
              </button>
              <button 
                className={`tab-button ${activeTab === 'compliance' ? 'active' : ''}`} 
                onClick={() => setActiveTab('compliance')}
              >
                Non-Compliance
              </button>
            </div>
            
            {/* Waste Overview Tab */}
            {activeTab === 'overview' && (
              <>
                <div className="card">
                  <h2>All E-Waste Items</h2>
                  {wasteItems.length === 0 ? (
                    <p>No waste items found.</p>
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
                          <th>Status</th>
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
                            <td>{`${item.producer.slice(0, 6)}...${item.producer.slice(-4)}`}</td>
                            <td>
                              <span className={`status-badge ${item.isProcessed ? 'status-success' : 'status-pending'}`}>
                                {item.isProcessed ? 'Processed' : 'Pending'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn" 
                                onClick={() => {
                                  viewWasteDetails(item.id);
                                  // Pre-fill audit form with this waste ID
                                  setAuditForm({
                                    ...auditForm,
                                    wasteId: item.id
                                  });
                                  setActiveTab('audit');
                                }}
                                style={{ padding: '5px 10px' }}
                              >
                                Audit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                
                <div className="card">
                  <h2>Recent Audit History</h2>
                  {audits.length === 0 ? (
                    <p>No audit records found.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th>Audit ID</th>
                          <th>Waste ID</th>
                          <th>Status</th>
                          <th>Auditor</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {audits.slice(-5).map((audit) => (
                          <tr key={audit.id} style={{ borderBottom: '1px solid #ddd' }}>
                            <td>{audit.id.substring(audit.id.indexOf('_') + 1, audit.id.indexOf('_') + 7)}</td>
                            <td>{audit.wasteId}</td>
                            <td>
                              <span className={`status-badge ${audit.status === 'Compliant' ? 'status-success' : audit.status === 'NonCompliant' ? 'status-error' : audit.status === 'Warning' ? 'status-warning' : 'status-info'}`}>
                                {audit.status}
                              </span>
                            </td>
                            <td>{`${audit.auditor.slice(0, 6)}...${audit.auditor.slice(-4)}`}</td>
                            <td>{new Date(audit.auditedAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
            
            {/* Audit Tab */}
            {activeTab === 'audit' && (
              <div className="card">
                <h2>Perform Compliance Audit</h2>
                <form onSubmit={createAudit}>
                  <div className="form-control">
                    <label>Waste Item ID</label>
                    <select
                      name="wasteId"
                      value={auditForm.wasteId}
                      onChange={handleAuditFormChange}
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
                    <label>Compliance Status</label>
                    <select
                      name="status"
                      value={auditForm.status}
                      onChange={handleAuditFormChange}
                      required
                    >
                      <option value="Compliant">Compliant</option>
                      <option value="NonCompliant">Non-Compliant</option>
                      <option value="Warning">Warning</option>
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label>Audit Details</label>
                    <textarea
                      name="details"
                      value={auditForm.details}
                      onChange={handleAuditFormChange}
                      placeholder="Detailed description of audit findings"
                      rows="3"
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label>Evidence Reference</label>
                    <input
                      type="text"
                      name="evidence"
                      value={auditForm.evidence}
                      onChange={handleAuditFormChange}
                      placeholder="Reference to supporting evidence (optional)"
                    />
                  </div>
                  
                  <button 
                    className="btn btn-block" 
                    type="submit" 
                    disabled={loading}
                    style={{ marginTop: '10px' }}
                  >
                    {loading ? 'Processing...' : 'Submit Audit'}
                  </button>
                </form>
                
                {selectedWaste && (
                  <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h3>Selected Waste Details</h3>
                    <div style={{ display: 'flex' }}>
                      <div style={{ flex: '1' }}>
                        <p><strong>ID:</strong> {selectedWaste.id}</p>
                        <p><strong>Type:</strong> {selectedWaste.wasteType}</p>
                        <p><strong>Origin:</strong> {selectedWaste.origin}</p>
                        <p><strong>Quantity:</strong> {web3.utils.fromWei(selectedWaste.quantity.toString(), 'ether')}</p>
                        <p><strong>Description:</strong> {selectedWaste.description}</p>
                        <p><strong>Date Logged:</strong> {selectedWaste.loggedAt}</p>
                        <p><strong>Deadline:</strong> {selectedWaste.deadline}</p>
                        <p><strong>Status:</strong> {selectedWaste.isProcessed ? 'Processed' : 'Pending'}</p>
                      </div>
                      {selectedWaste.imageUrl && (
                        <div style={{ flex: '1', textAlign: 'center' }}>
                          <img 
                            src={selectedWaste.imageUrl} 
                            alt="Waste" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '200px', 
                              borderRadius: '8px'
                            }} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Certificates Tab */}
            {activeTab === 'certificates' && (
              <div className="card">
                <h2>Compliance Certificates</h2>
                
                <div style={{ marginBottom: '30px' }}>
                  <h3>Issue New Certificate</h3>
                  <form onSubmit={issueCertificate}>
                    <div className="form-control">
                      <label>Waste Item ID</label>
                      <select
                        name="wasteId"
                        value={certificateForm.wasteId}
                        onChange={handleCertificateFormChange}
                        required
                      >
                        <option value="">Select waste item</option>
                        {wasteItems
                          .filter(item => item.isProcessed)
                          .map(item => (
                            <option key={item.id} value={item.id}>
                              ID: {item.id} - {item.wasteType} ({item.origin})
                            </option>
                          ))}
                      </select>
                      <small style={{ color: '#777' }}>
                        Note: Only processed waste items can receive certificates
                      </small>
                    </div>
                    
                    <div className="form-control">
                      <label>Recipient Address</label>
                      <input
                        type="text"
                        name="recipientAddress"
                        value={certificateForm.recipientAddress}
                        onChange={handleCertificateFormChange}
                        placeholder="0x..."
                        required
                      />
                    </div>
                    
                    <div className="form-control">
                      <label>Certificate Type</label>
                      <select
                        name="certificateType"
                        value={certificateForm.certificateType}
                        onChange={handleCertificateFormChange}
                        required
                      >
                        <option value="Recycling">Recycling Certificate</option>
                        <option value="Disposal">Proper Disposal Certificate</option>
                        <option value="Processing">Processing Certificate</option>
                        <option value="Compliance">General Compliance Certificate</option>
                      </select>
                    </div>
                    
                    <div className="form-control">
                      <label>Certificate Details</label>
                      <textarea
                        name="details"
                        value={certificateForm.details}
                        onChange={handleCertificateFormChange}
                        placeholder="Detailed description of the certificate"
                        rows="3"
                        required
                      />
                    </div>
                    
                    <button 
                      className="btn btn-block" 
                      type="submit" 
                      disabled={loading}
                      style={{ marginTop: '10px' }}
                    >
                      {loading ? 'Processing...' : 'Issue Certificate'}
                    </button>
                  </form>
                </div>
                
                <h3>Issued Certificates</h3>
                {certificates.length === 0 ? (
                  <p>No certificates have been issued yet.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Certificate ID</th>
                        <th>Waste ID</th>
                        <th>Type</th>
                        <th>Recipient</th>
                        <th>Issued Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certificates.map((cert) => (
                        <tr key={cert.id} style={{ borderBottom: '1px solid #ddd' }}>
                          <td>{cert.id.substring(cert.id.indexOf('_') + 1, cert.id.indexOf('_') + 7)}</td>
                          <td>{cert.wasteId}</td>
                          <td>{cert.certificateType}</td>
                          <td>{`${cert.recipient.slice(0, 6)}...${cert.recipient.slice(-4)}`}</td>
                          <td>{new Date(cert.issuedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            
            {/* Non-Compliance Tab */}
            {activeTab === 'compliance' && (
              <div className="card">
                <h2>Non-Compliance Reports</h2>
                {nonCompliances.length === 0 ? (
                  <p>No non-compliance issues have been reported.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Waste ID</th>
                        <th>Details</th>
                        <th>Responsible Party</th>
                        <th>Reported Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nonCompliances.map((nc) => (
                        <tr key={nc.id} style={{ borderBottom: '1px solid #ddd' }}>
                          <td>{nc.id.substring(nc.id.indexOf('_') + 1, nc.id.indexOf('_') + 7)}</td>
                          <td>{nc.wasteId}</td>
                          <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {nc.details}
                          </td>
                          <td>{`${nc.responsible.slice(0, 6)}...${nc.responsible.slice(-4)}`}</td>
                          <td>{new Date(nc.reportedAt).toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${nc.status === 'Open' ? 'status-error' : nc.status === 'In Progress' ? 'status-warning' : 'status-success'}`}>
                              {nc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                <div style={{ marginTop: '30px' }}>
                  <h3>Compliance Guidelines</h3>
                  <ul style={{ textAlign: 'left' }}>
                    <li><strong>Proper Documentation</strong> - All waste must be properly documented with accurate details</li>
                    <li><strong>Processing Deadlines</strong> - Waste must be processed before the set deadline</li>
                    <li><strong>Recycling Standards</strong> - All recycling must meet environmental standards</li>
                    <li><strong>Chain of Custody</strong> - Complete tracking throughout the waste lifecycle</li>
                    <li><strong>Reporting Requirements</strong> - Regular reports must be submitted to maintain compliance</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RegulatorDashboard;