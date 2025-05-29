import Web3 from 'web3';

// Contract ABIs
import UserManagementABI from '../contracts/UserManagementABI.json';
import EWasteTrackingABI from '../contracts/EWasteTrackingABI.json';

// Initialize web3
export const initWeb3 = async () => {
  if (window.ethereum) {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      return new Web3(window.ethereum);
    } catch (error) {
      throw new Error("User denied account access");
    }
  } else if (window.web3) {
    // Legacy dapp browsers
    return new Web3(window.web3.currentProvider);
  } else {
    throw new Error('No Ethereum browser extension detected, install MetaMask!');
  }
};

// Get current account
export const getCurrentAccount = async (web3) => {
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
};

// Create contract instances
export const getContracts = async (web3, contractAddresses) => {
  const { userManagementAddress, eWasteTrackingAddress } = contractAddresses;
  
  const userManagement = new web3.eth.Contract(
    UserManagementABI,
    userManagementAddress
  );
  
  const eWasteTracking = new web3.eth.Contract(
    EWasteTrackingABI,
    eWasteTrackingAddress
  );
  
  return { userManagement, eWasteTracking };
};

// Role enum mapping
export const Roles = {
  Producer: 0,
  Recycler: 1,
  Logistics: 2,
  Regulator: 3,
  None: 4
};

// Format timestamp to readable date
export const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString();
};

// Convert Wei to Ether
export const weiToEth = (web3, wei) => {
  return web3.utils.fromWei(wei, 'ether');
};

// Convert Ether to Wei
export const ethToWei = (web3, eth) => {
  return web3.utils.toWei(eth, 'ether');
};