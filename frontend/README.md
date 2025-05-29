# E-Waste Tracking System Frontend

This is the React frontend for the E-Waste Tracking System, a blockchain-based solution for tracking electronic waste from production to recycling.

## Overview

The E-Waste Tracking System is a blockchain-powered platform that facilitates the tracking and management of electronic waste throughout its lifecycle. The system uses smart contracts on the Ethereum blockchain to ensure transparency, data integrity, and accountability in the e-waste management process.

## Features

- **Role-based Access Control**: Different stakeholders (Producers, Recyclers, Logistics, Regulators) have specific dashboards and permissions
- **MetaMask Integration**: Secure blockchain interaction using MetaMask wallet
- **Producer Dashboard**: Log new waste items and track their status
- **Recycler Dashboard**: Process waste items and update recycling status
- **Logistics Dashboard**: Manage transportation and chain of custody
- **Regulator Dashboard**: Monitor compliance and issue certifications
- **Admin Panel**: Manage users and system settings

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MetaMask browser extension
- Ganache for local blockchain development
- Truffle (for smart contract deployment)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Configure contract addresses in `src/config.js`:
   ```js
   const config = {
     contracts: {
       userManagementAddress: "YOUR_USER_MANAGEMENT_CONTRACT_ADDRESS",
       eWasteTrackingAddress: "YOUR_EWASTE_TRACKING_CONTRACT_ADDRESS"
     }
   };
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to http://localhost:3000

### Testing Blockchain Connection

Once the application is running, you can test the blockchain connection:

1. Connect your MetaMask wallet
2. Open the browser console (F12)
3. Run `testConnection()`
4. Check the console for connection status

## Project Structure

- `src/`
  - `components/` - React components for different dashboards and UI elements
  - `contracts/` - ABI files for smart contract interaction
  - `utils/` - Utility functions for web3, date handling, etc.
  - `App.js` - Main application component with routing
  - `config.js` - Configuration file for contract addresses

## User Workflows

### Producer Workflow

1. Connect with MetaMask
2. Login as Producer
3. Register if not already registered
4. Log new e-waste items with details
5. View logged waste items and their status

### Recycler Workflow

1. Connect with MetaMask
2. Login as Recycler
3. Register if not already registered
4. View available waste items for processing
5. Mark items as processed

### Logistics Workflow

1. Connect with MetaMask
2. Login as Logistics
3. Register if not already registered
4. Manage waste transportation

### Regulator Workflow

1. Connect with MetaMask
2. Login as Regulator
3. Register if not already registered
4. Monitor compliance and audit waste management

### Admin Workflow

1. Connect with MetaMask (must be admin address)
2. Access Admin Panel
3. Register users and manage their roles
4. Change admin if needed

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.