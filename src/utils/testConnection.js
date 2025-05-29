import { initWeb3, getCurrentAccount, getContracts } from './web3Utils';
import config from '../config';

/**
 * Test function to verify connection to the blockchain and contracts
 * This can be run from browser console: testBlockchainConnection()
 */
export const testBlockchainConnection = async () => {
  try {
    console.log('Testing blockchain connection...');
    
    // Initialize Web3
    const web3 = await initWeb3();
    console.log('✅ Web3 initialized successfully');
    
    // Get current account
    const account = await getCurrentAccount(web3);
    console.log('✅ Connected account:', account);
    
    // Check network
    const networkId = await web3.eth.net.getId();
    console.log('✅ Connected to network ID:', networkId);
    
    // Get contract instances
    const { userManagementAddress, eWasteTrackingAddress } = config.contracts;
    
    if (userManagementAddress === "0x0000000000000000000000000000000000000000" ||
        eWasteTrackingAddress === "0x0000000000000000000000000000000000000000") {
      console.error('❌ Contract addresses not configured. Update config.js with actual addresses.');
      return false;
    }
    
    const { userManagement, eWasteTracking } = await getContracts(web3, config.contracts);
    console.log('✅ Contract instances created');
    
    // Test UserManagement contract
    try {
      const admin = await userManagement.methods.admin().call();
      console.log('✅ UserManagement contract connected. Admin:', admin);
    } catch (error) {
      console.error('❌ Failed to call UserManagement contract:', error);
      return false;
    }
    
    // Test EWasteTracking contract
    try {
      const wasteCounter = await eWasteTracking.methods.wasteCounter().call();
      console.log('✅ EWasteTracking contract connected. Waste counter:', wasteCounter);
    } catch (error) {
      console.error('❌ Failed to call EWasteTracking contract:', error);
      return false;
    }
    
    console.log('✅ Blockchain connection test completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Blockchain connection test failed:', error);
    return false;
  }
};

// Make accessible from browser console
window.testBlockchainConnection = testBlockchainConnection;