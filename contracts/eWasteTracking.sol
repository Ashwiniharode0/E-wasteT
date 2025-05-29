// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserManagement.sol";

contract eWasteTracking {
    UserManagement public userManagement;

    struct eWasteItem {
        uint id;
        string wasteType;
        string origin;
        uint quantity;
        string description;
        string imageHash;  // IPFS hash for image
        uint256 deadline;  // Deadline set by producer
        uint256 loggedAt;
        address producer;
        bool isProcessed;
        string recyclingMethod;  // How the item was recycled
    }

    mapping(uint => eWasteItem) public wasteRecords;
    uint public wasteCounter;
    
    // Events
    event WasteLogged(
        uint id, 
        string wasteType, 
        string origin, 
        uint quantity, 
        string description,
        string imageHash,
        uint256 deadline, 
        address indexed producer
    );
    event WasteProcessed(uint id, address indexed recycler, string recyclingMethod);
    event WasteUpdated(uint id, string field, string newValue);

    constructor(address _userManagementAddress) {
        userManagement = UserManagement(_userManagementAddress);
        wasteCounter = 0;
    }

    modifier onlyProducer() {
        require(
            userManagement.getUserRole(msg.sender) == UserManagement.Role.Producer,
            "Unauthorized: Only producers can perform this action"
        );
        _;
    }

    modifier onlyRecycler() {
        require(
            userManagement.getUserRole(msg.sender) == UserManagement.Role.Recycler,
            "Unauthorized: Only recyclers can perform this action"
        );
        _;
    }

    function logWaste(
        string memory _wasteType,
        string memory _origin,
        uint _quantity,
        string memory _description,
        string memory _imageHash,
        uint256 _deadline
    ) external onlyProducer {
        require(_quantity > 0, "Quantity must be greater than zero.");
        require(_deadline > block.timestamp, "Deadline must be in the future.");

        wasteCounter++;
        wasteRecords[wasteCounter] = eWasteItem({
            id: wasteCounter,
            wasteType: _wasteType,
            origin: _origin,
            quantity: _quantity,
            description: _description,
            imageHash: _imageHash,
            deadline: _deadline,
            loggedAt: block.timestamp,
            producer: msg.sender,
            isProcessed: false,
            recyclingMethod: ""
        });
        
        emit WasteLogged(
            wasteCounter, 
            _wasteType, 
            _origin, 
            _quantity, 
            _description,
            _imageHash,
            _deadline, 
            msg.sender
        );
    }

    function markAsProcessed(uint _id, string memory _recyclingMethod) external onlyRecycler {
        require(wasteRecords[_id].id != 0, "Waste item does not exist.");
        require(!wasteRecords[_id].isProcessed, "Waste item already processed.");
        require(bytes(_recyclingMethod).length > 0, "Recycling method must be specified.");
        
        wasteRecords[_id].isProcessed = true;
        wasteRecords[_id].recyclingMethod = _recyclingMethod;
        emit WasteProcessed(_id, msg.sender, _recyclingMethod);
    }

    function updateWasteDetails(
        uint _id, 
        string memory _field, 
        string memory _value
    ) external onlyProducer {
        require(wasteRecords[_id].id != 0, "Waste item does not exist.");
        require(wasteRecords[_id].producer == msg.sender, "Only the original producer can update waste details.");
        require(!wasteRecords[_id].isProcessed, "Cannot update processed waste.");
        
        if (keccak256(bytes(_field)) == keccak256(bytes("wasteType"))) {
            wasteRecords[_id].wasteType = _value;
        } else if (keccak256(bytes(_field)) == keccak256(bytes("origin"))) {
            wasteRecords[_id].origin = _value;
        } else if (keccak256(bytes(_field)) == keccak256(bytes("description"))) {
            wasteRecords[_id].description = _value;
        } else if (keccak256(bytes(_field)) == keccak256(bytes("imageHash"))) {
            wasteRecords[_id].imageHash = _value;
        } else {
            revert("Invalid field name for update.");
        }
        
        emit WasteUpdated(_id, _field, _value);
    }

    function getWasteItem(uint _id) external view returns (
        uint id,
        string memory wasteType,
        string memory origin,
        uint quantity,
        string memory description,
        string memory imageHash,
        uint256 deadline,
        uint256 loggedAt,
        address producer,
        bool isProcessed,
        string memory recyclingMethod
    ) {
        eWasteItem memory item = wasteRecords[_id];
        require(item.id != 0, "Waste item does not exist.");
        
        return (
            item.id,
            item.wasteType,
            item.origin,
            item.quantity,
            item.description,
            item.imageHash,
            item.deadline,
            item.loggedAt,
            item.producer,
            item.isProcessed,
            item.recyclingMethod
        );
    }
    
    function getWasteItemsByProducer(address _producer) external view returns (uint[] memory) {
        uint count = 0;
        
        // Count waste items for this producer
        for (uint i = 1; i <= wasteCounter; i++) {
            if (wasteRecords[i].producer == _producer) {
                count++;
            }
        }
        
        // Create array of IDs
        uint[] memory result = new uint[](count);
        uint index = 0;
        
        // Fill array with IDs
        for (uint i = 1; i <= wasteCounter; i++) {
            if (wasteRecords[i].producer == _producer) {
                result[index] = wasteRecords[i].id;
                index++;
            }
        }
        
        return result;
    }
    
    function getAllWasteItems() external view returns (uint[] memory) {
        uint[] memory allItems = new uint[](wasteCounter);
        
        for (uint i = 1; i <= wasteCounter; i++) {
            allItems[i-1] = i;
        }
        
        return allItems;
    }
}