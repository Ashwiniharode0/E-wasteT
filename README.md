# E-Waste Tracking System

A blockchain-based system for tracking electronic waste from production to recycling with role-based access control and regulatory compliance.

## Project Overview

This project implements a comprehensive e-waste tracking system using Ethereum blockchain technology. The system allows for the traceability of electronic waste from its production to recycling, ensuring accountability and regulatory compliance.

### Key Features

- **Role-Based Access Control**: Different stakeholders (Producers, Recyclers, Logistics, Regulators) have specific roles and permissions
- **E-Waste Logging**: Producers can log e-waste items with detailed information
- **Tracking**: E-waste items can be tracked throughout their lifecycle
- **Compliance Auditing**: Regulators can audit the system for compliance
- **Secure and Transparent**: Blockchain ensures immutable record-keeping and transparency

## Technologies Used

- **Frontend**: React.js
- **Web3 Integration**: Web3.js, MetaMask
- **Smart Contracts**: Solidity
- **Blockchain Network**: Ethereum (Local development using Ganache)
- **Contract Development**: Truffle

## Project Structure

- `/contracts`: Solidity smart contracts
  - `UserManagement.sol`: Handles user registration and role management
  - `eWasteTracking.sol`: Manages e-waste item logging and tracking
  - `LogisticsTracking.sol`: Manages logistics operations
  - `ComplianceAudit.sol`: Handles regulatory compliance audits
  - `RecyclingManagement.sol`: Manages recycling operations
- `/frontend`: React.js application
  - `/src/components`: React components
  - `/src/contracts`: Contract ABIs
  - `/src/utils`: Utility functions
- `/migrations`: Truffle migration scripts

## Getting Started

See the [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md) file for detailed deployment and setup instructions.

## Application Flow

1. **User Registration**: Users register with their role (Producer, Recycler, Logistics, Regulator)
2. **Login**: Users connect with MetaMask and select their role
3. **For Producers**:
   - Log new e-waste items with details (type, quantity, origin, etc.)
   - View and manage logged waste items
4. **For Recyclers**:
   - View available e-waste items for processing
   - Mark items as processed
5. **For Logistics**:
   - Track e-waste items in transit
   - Update logistics information
6. **For Regulators**:
   - Audit compliance
   - View comprehensive reports

## Testing

To test the blockchain connection:

1. Deploy the contracts to Ganache
2. Update contract addresses in `frontend/src/config.js`
3. Run the application
4. Open browser console and run `testConnection()` to verify the blockchain connection

## License

MIT