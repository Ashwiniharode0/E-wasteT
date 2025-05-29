const UserManagement = artifacts.require("UserManagement");
const EWasteTracking = artifacts.require("eWasteTracking");
const LogisticsTracking = artifacts.require("LogisticsTracking");
const ComplianceAudit = artifacts.require("ComplianceAudit");
const RecyclingManagement = artifacts.require("RecyclingManagement");

module.exports = async function(deployer) {
  // Deploy UserManagement first
  await deployer.deploy(UserManagement);
  const userManagementInstance = await UserManagement.deployed();
  
  // Deploy eWasteTracking with UserManagement address
  await deployer.deploy(EWasteTracking, userManagementInstance.address);
  const eWasteTrackingInstance = await EWasteTracking.deployed();
  
  // Deploy RecyclingManagement
  await deployer.deploy(RecyclingManagement, userManagementInstance.address, eWasteTrackingInstance.address);
  const recyclingManagementInstance = await RecyclingManagement.deployed();
  
  // Deploy LogisticsTracking - only requires userManagement address
  await deployer.deploy(LogisticsTracking, userManagementInstance.address);
  const logisticsTrackingInstance = await LogisticsTracking.deployed();
  
  // Deploy ComplianceAudit - requires all other contract addresses
  await deployer.deploy(
    ComplianceAudit,
    userManagementInstance.address,
    recyclingManagementInstance.address,
    eWasteTrackingInstance.address,
    logisticsTrackingInstance.address
  );
  
  // Log the addresses for reference
  console.log(`
  UserManagement: ${userManagementInstance.address}
  EWasteTracking: ${eWasteTrackingInstance.address}
  RecyclingManagement: ${recyclingManagementInstance.address}
  LogisticsTracking: ${logisticsTrackingInstance.address}
  ComplianceAudit: ${await ComplianceAudit.deployed().then(instance => instance.address)}
  `);
};