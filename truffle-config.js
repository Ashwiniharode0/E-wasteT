module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,     // Default Ganache GUI port
      network_id: "*" // Match any network id
    }
  },
  compilers: {
    solc: {
      version: "0.8.0",    // Match your solidity version
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};