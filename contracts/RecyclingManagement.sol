// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserManagement.sol";
import "./eWasteTracking.sol";

contract RecyclingManagement {
    UserManagement public userManagement;
    eWasteTracking public eWasteTracker;

    enum RecyclingStatus { NotStarted, InProgress, Completed }

    struct RecycledItem {
        uint wasteId;
        string method;
        address recycler;
        RecyclingStatus status;
        uint progressPercentage;
        string[] materialRecovered;
        uint[] materialQuantities;
        string evidenceHash; // IPFS hash for evidence documents/images
        uint256 startedAt;
        uint256 completedAt;
    }

    mapping(uint => RecycledItem) public recycledWaste;
    mapping(address => uint[]) public recyclerItems;
    
    // Events
    event RecyclingStarted(uint wasteId, address recycler, string method, uint256 startedAt);
    event RecyclingUpdated(uint wasteId, address recycler, uint progressPercentage);
    event RecyclingCompleted(uint wasteId, address recycler, uint256 completedAt);
    event MaterialRecovered(uint wasteId, string material, uint quantity);
    event NonCompliance(uint wasteId, address recycler, string reason);

    constructor(address _userManagementAddress, address _eWasteTrackerAddress) {
        userManagement = UserManagement(_userManagementAddress);
        eWasteTracker = eWasteTracking(_eWasteTrackerAddress);
    }

    modifier onlyRecycler() {
        require(
            userManagement.getUserRole(msg.sender) == UserManagement.Role.Recycler,
            "Unauthorized: Only recyclers can perform this action."
        );
        _;
    }

    modifier onlyAssignedRecycler(uint _wasteId) {
        require(recycledWaste[_wasteId].recycler == address(0) || recycledWaste[_wasteId].recycler == msg.sender, 
            "Unauthorized: Only the assigned recycler can modify this waste item.");
        _;
    }

    function startRecycling(uint _wasteId, string memory _method) external onlyRecycler onlyAssignedRecycler(_wasteId) {
        (
            uint id,
            , // wasteType - unused
            , // origin - unused
            , // quantity - unused
            , // description - unused
            , // imageHash - unused
            uint256 deadline,
            , // loggedAt - unused
            , // producer - unused
            bool isProcessed,
            // recyclingMethod - unused
        ) = eWasteTracker.getWasteItem(_wasteId);
        
        require(id != 0, "Waste item does not exist.");
        require(!isProcessed, "Waste has already been processed.");
        
        // Check if entry exists, if not create it
        if (recycledWaste[_wasteId].recycler == address(0)) {
            recycledWaste[_wasteId] = RecycledItem({
                wasteId: _wasteId,
                method: _method,
                recycler: msg.sender,
                status: RecyclingStatus.InProgress,
                progressPercentage: 0,
                materialRecovered: new string[](0),
                materialQuantities: new uint[](0),
                evidenceHash: "",
                startedAt: block.timestamp,
                completedAt: 0
            });
            
            // Add to recycler's list
            recyclerItems[msg.sender].push(_wasteId);
        } else {
            // Update existing entry
            recycledWaste[_wasteId].method = _method;
            recycledWaste[_wasteId].status = RecyclingStatus.InProgress;
            recycledWaste[_wasteId].startedAt = block.timestamp;
        }
        
        emit RecyclingStarted(_wasteId, msg.sender, _method, block.timestamp);
        
        // Check if deadline has passed
        if (block.timestamp > deadline) {
            emit NonCompliance(_wasteId, msg.sender, "Recycling started after deadline.");
        }
    }

    function updateRecyclingProgress(
        uint _wasteId, 
        uint _progressPercentage, 
        string memory _evidenceHash
    ) external onlyRecycler onlyAssignedRecycler(_wasteId) {
        require(recycledWaste[_wasteId].recycler != address(0), "Recycling not yet started for this waste item.");
        require(recycledWaste[_wasteId].status != RecyclingStatus.Completed, "Recycling already completed.");
        require(_progressPercentage <= 100, "Progress percentage cannot exceed 100.");
        
        recycledWaste[_wasteId].progressPercentage = _progressPercentage;
        recycledWaste[_wasteId].evidenceHash = _evidenceHash;
        
        if (_progressPercentage == 100) {
            recycledWaste[_wasteId].status = RecyclingStatus.Completed;
            recycledWaste[_wasteId].completedAt = block.timestamp;
            
            // Mark as processed in eWasteTracking contract
            eWasteTracker.markAsProcessed(_wasteId, recycledWaste[_wasteId].method);
            
            emit RecyclingCompleted(_wasteId, msg.sender, block.timestamp);
        } else {
            emit RecyclingUpdated(_wasteId, msg.sender, _progressPercentage);
        }
    }

    function addRecoveredMaterial(
        uint _wasteId, 
        string memory _material, 
        uint _quantity
    ) external onlyRecycler onlyAssignedRecycler(_wasteId) {
        require(recycledWaste[_wasteId].recycler != address(0), "Recycling not yet started for this waste item.");
        
        recycledWaste[_wasteId].materialRecovered.push(_material);
        recycledWaste[_wasteId].materialQuantities.push(_quantity);
        
        emit MaterialRecovered(_wasteId, _material, _quantity);
    }

    function getRecycledItem(uint _wasteId) external view returns (
        uint wasteId,
        string memory method,
        address recycler,
        RecyclingStatus status,
        uint progressPercentage,
        string[] memory materialRecovered,
        uint[] memory materialQuantities,
        string memory evidenceHash,
        uint256 startedAt,
        uint256 completedAt
    ) {
        RecycledItem memory item = recycledWaste[_wasteId];
        require(item.recycler != address(0), "No recycling data for this waste item.");
        
        return (
            item.wasteId,
            item.method,
            item.recycler,
            item.status,
            item.progressPercentage,
            item.materialRecovered,
            item.materialQuantities,
            item.evidenceHash,
            item.startedAt,
            item.completedAt
        );
    }

    function getRecyclerItems(address _recycler) external view returns (uint[] memory) {
        return recyclerItems[_recycler];
    }
    
    function getItemsByStatus(RecyclingStatus _status) external view returns (uint[] memory) {
        // Count items with the status
        uint count = 0;
        for (uint i = 0; i < recyclerItems[msg.sender].length; i++) {
            uint wasteId = recyclerItems[msg.sender][i];
            if (recycledWaste[wasteId].status == _status) {
                count++;
            }
        }
        
        // Create result array
        uint[] memory result = new uint[](count);
        uint index = 0;
        
        // Fill result array
        for (uint i = 0; i < recyclerItems[msg.sender].length; i++) {
            uint wasteId = recyclerItems[msg.sender][i];
            if (recycledWaste[wasteId].status == _status) {
                result[index] = wasteId;
                index++;
            }
        }
        
        return result;
    }
}