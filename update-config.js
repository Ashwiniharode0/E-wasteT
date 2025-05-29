const fs = require('fs');
const path = require('path');

// Usage: node update-config.js <UserManagementAddress> <EWasteTrackingAddress>
// Example: node update-config.js 0x8B3e0a97A34e471E3429a20095458e98451ab9C6 0xc9338c7BDF1507B3EbaC9A9Bc785686cbb8f01EB

if (process.argv.length < 4) {
  console.error('Usage: node update-config.js <UserManagementAddress> <EWasteTrackingAddress>');
  process.exit(1);
}

const userManagementAddress = process.argv[2];
const eWasteTrackingAddress = process.argv[3];

const configPath = path.join(__dirname, 'frontend', 'src', 'config.js');

const configContent = `// Auto-updated contract addresses from deployment
const config = {
  contracts: {
    userManagementAddress: "${userManagementAddress}",
    eWasteTrackingAddress: "${eWasteTrackingAddress}"
  }
};

export default config;
`;

try {
  fs.writeFileSync(configPath, configContent);
  console.log('Config updated successfully with:');
  console.log(`- UserManagement: ${userManagementAddress}`);
  console.log(`- EWasteTracking: ${eWasteTrackingAddress}`);
} catch (error) {
  console.error('Error updating config:', error);
  process.exit(1);
}