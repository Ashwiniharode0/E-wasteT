# Deployment Instructions

This document explains how to deploy the smart contracts to Ganache and connect the React frontend.

## Prerequisites

1. Make sure Ganache is running
2. Make sure MetaMask is installed and connected to Ganache
3. Truffle is installed globally (`npm install -g truffle`)
4. Node.js is installed

## Deployment Steps

### 1. Deploy the Smart Contracts

```bash
# Navigate to the project root directory
cd "D:\project\ewaste v3"

# Install truffle dependencies
npm install @truffle/hdwallet-provider

# Compile the contracts
truffle compile

# Deploy to the local Ganache network
truffle migrate --network development
```

The deployment script will output the addresses of the deployed contracts. Make note of the `UserManagement` and `EWasteTracking` addresses.

Example output:
```
UserManagement: 0x8B3e0a97A34e471E3429a20095458e98451ab9C6
EWasteTracking: 0xc9338c7BDF1507B3EbaC9A9Bc785686cbb8f01EB
RecyclingManagement: 0x...
LogisticsTracking: 0x...
ComplianceAudit: 0x...
```

### 2. Update the Frontend Configuration

You can update the configuration automatically using the provided script:

```bash
# Run the update-config script with the contract addresses
node update-config.js 0x8B3e0a97A34e471E3429a20095458e98451ab9C6 0xc9338c7BDF1507B3EbaC9A9Bc785686cbb8f01EB
```

Or you can manually edit the config.js file in the frontend/src directory:

```javascript
// D:\project\ewaste v3\frontend\src\config.js
const config = {
  contracts: {
    userManagementAddress: "0x8B3e0a97A34e471E3429a20095458e98451ab9C6", // Replace with your UserManagement address
    eWasteTrackingAddress: "0xc9338c7BDF1507B3EbaC9A9Bc785686cbb8f01EB" // Replace with your EWasteTracking address
  }
};

export default config;
```

### 3. Install Frontend Dependencies

```bash
# Navigate to the frontend directory
cd "D:\project\ewaste v3\frontend"

# Install dependencies
npm install

# Start the development server
npm start
```

The application should now be running at http://localhost:3000.

## Testing the Blockchain Connection

After setting up, you can test if the application can connect to the blockchain:

1. Start the React application
2. Open your browser's developer console (F12 or right-click > Inspect > Console)
3. Type `testConnection()` in the console and press Enter
4. Check the console output for connection status

Example successful output:
```
Testing blockchain connection...
✅ Web3 initialized successfully
✅ Connected account: 0x854399CE7C4592921225d24168950ef227EF2166
✅ Connected to network ID: 5777
✅ Contract instances created
✅ UserManagement contract connected. Admin: 0x854399CE7C4592921225d24168950ef227EF2166
✅ EWasteTracking contract connected. Waste counter: 0
✅ Blockchain connection test completed successfully
```

## Using the Application

1. Open MetaMask and ensure it's connected to Ganache
   - Network: Custom RPC with URL http://localhost:7545 (or your Ganache URL)
   - Chain ID: 1337
   - Import accounts using private keys from Ganache

2. Register as a Producer:
   - Connect your wallet when prompted
   - Select "Producer" role
   - You'll be prompted to register if not already registered
   - Approve the transaction in MetaMask

3. Log waste items:
   - Fill out the form with waste details
   - Submit the form and approve the transaction
   - View your logged waste in the list below

4. Register as a Recycler:
   - Connect your wallet when prompted
   - Select "Recycler" role
   - You'll be prompted to register if not already registered
   - Approve the transaction in MetaMask

5. Process waste items:
   - As a Recycler, you'll see unprocessed waste items in the dashboard
   - Click the "Process" button for an item you want to recycle
   - In the popup modal, enter the recycling method used (e.g., "Disassembled components and melted precious metals")
   - Submit the form and approve the transaction
   - The item will be marked as processed and moved to the "Processed E-Waste Items" section

## Updating Smart Contracts

If you make changes to the smart contracts (such as the recent addition of the recycling method), follow these steps to update the deployment:

1. Update your contracts in the `/contracts` directory (you'll need to redeploy if you've changed any contract structure)

2. Recompile and migrate the contracts:
   ```bash
   truffle compile
   truffle migrate --reset --network development
   ```
   Note: The `--reset` flag forces the contracts to be redeployed, which is necessary when changing contract structure.

3. After migration, note the new contract addresses from the console output

4. Update the frontend config.js file with the new contract addresses (manually or using the update-config.js script)

5. Restart the frontend application

## Common Issues

### MetaMask Connection Issues

If you encounter issues connecting MetaMask:
- Make sure MetaMask is unlocked
- Make sure MetaMask is connected to the Ganache network (usually http://localhost:7545)
- Add Ganache accounts to MetaMask by importing their private keys:
  1. Open Ganache and click on the key icon for an account
  2. Copy the private key
  3. In MetaMask, click on your account icon > Import Account
  4. Paste the private key and click Import

### Contract Interaction Issues

If contract interactions fail:
- Check the contract addresses in config.js
- Make sure Ganache is running and the contracts are deployed
- Check the browser console for error messages
- Make sure you have enough ETH in your account for gas

### Transaction Failures

If transactions fail:
- Check gas price and limit in MetaMask settings
- Make sure your account has the correct role for the action
- Check the browser console for specific error messages

## Changelog

### Version 1.1
- Added recycling method tracking feature:
  - Recyclers can now specify how e-waste items were recycled
  - Recycling methods are stored on the blockchain
  - Added a new section to display processed items with their recycling methods
  - Updated contract structure to include recycling method data
  - Modified recycler dashboard interface to collect recycling information

### Version 1.0
- Initial release with basic e-waste tracking functionality
- Support for Producer and Recycler roles
- Waste item logging and processing