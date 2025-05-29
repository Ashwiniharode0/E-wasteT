// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserManagement.sol";

contract LogisticsTracking {
    UserManagement public userManagement;

    enum ShipmentStatus { Pending, PickedUp, InTransit, Delivered, Cancelled }

    struct Shipment {
        uint id;
        uint wasteId;
        ShipmentStatus status;
        address transporter;
        string location;
        string trackingCode;
        uint256 createdAt;
        uint256 updatedAt;
        address producer;
        address receiver;
    }

    mapping(uint => Shipment) public shipments;
    uint public shipmentCounter;
    
    // Events
    event ShipmentCreated(
        uint id, 
        uint wasteId, 
        address indexed transporter, 
        address indexed producer, 
        address indexed receiver
    );
    event ShipmentUpdated(
        uint id, 
        uint wasteId, 
        ShipmentStatus status, 
        string location, 
        uint256 updatedAt
    );
    event ShipmentDelivered(uint id, uint wasteId, uint256 deliveredAt);
    event ShipmentCancelled(uint id, uint wasteId, uint256 cancelledAt);

    constructor(address _userManagementAddress) {
        userManagement = UserManagement(_userManagementAddress);
        shipmentCounter = 0;
    }

    modifier onlyLogistics() {
        require(
            userManagement.getUserRole(msg.sender) == UserManagement.Role.Logistics,
            "Unauthorized: Only logistics providers can perform this action."
        );
        _;
    }

    modifier onlyInvolved(uint _shipmentId) {
        Shipment memory shipment = shipments[_shipmentId];
        require(
            msg.sender == shipment.transporter || 
            msg.sender == shipment.producer || 
            msg.sender == shipment.receiver,
            "Unauthorized: Only parties involved in this shipment can view its details."
        );
        _;
    }

    function createShipment(
        uint _wasteId, 
        address _producer, 
        address _receiver, 
        string memory _trackingCode
    ) external onlyLogistics {
        shipmentCounter++;
        
        shipments[shipmentCounter] = Shipment({
            id: shipmentCounter,
            wasteId: _wasteId,
            status: ShipmentStatus.Pending,
            transporter: msg.sender,
            location: "Origin",
            trackingCode: _trackingCode,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            producer: _producer,
            receiver: _receiver
        });
        
        emit ShipmentCreated(
            shipmentCounter, 
            _wasteId, 
            msg.sender, 
            _producer, 
            _receiver
        );
    }

    function updateShipment(
        uint _shipmentId, 
        ShipmentStatus _status, 
        string memory _location
    ) external onlyLogistics {
        require(_shipmentId > 0 && _shipmentId <= shipmentCounter, "Invalid shipment ID");
        require(shipments[_shipmentId].transporter == msg.sender, "Only the assigned transporter can update this shipment");
        
        Shipment storage shipment = shipments[_shipmentId];
        
        // Validate status transition
        if (_status == ShipmentStatus.Delivered) {
            require(shipment.status == ShipmentStatus.InTransit, "Shipment must be in transit before delivery");
        } else if (_status == ShipmentStatus.Cancelled) {
            require(shipment.status != ShipmentStatus.Delivered, "Cannot cancel a delivered shipment");
        }
        
        shipment.status = _status;
        shipment.location = _location;
        shipment.updatedAt = block.timestamp;
        
        emit ShipmentUpdated(
            _shipmentId, 
            shipment.wasteId, 
            _status, 
            _location, 
            block.timestamp
        );
        
        if (_status == ShipmentStatus.Delivered) {
            emit ShipmentDelivered(_shipmentId, shipment.wasteId, block.timestamp);
        } else if (_status == ShipmentStatus.Cancelled) {
            emit ShipmentCancelled(_shipmentId, shipment.wasteId, block.timestamp);
        }
    }

    function getShipmentDetails(uint _shipmentId) external view onlyInvolved(_shipmentId) returns (
        uint id,
        uint wasteId,
        ShipmentStatus status,
        address transporter,
        string memory location,
        string memory trackingCode,
        uint256 createdAt,
        uint256 updatedAt,
        address producer,
        address receiver
    ) {
        Shipment memory shipment = shipments[_shipmentId];
        
        return (
            shipment.id,
            shipment.wasteId,
            shipment.status,
            shipment.transporter,
            shipment.location,
            shipment.trackingCode,
            shipment.createdAt,
            shipment.updatedAt,
            shipment.producer,
            shipment.receiver
        );
    }

    function getTransporterShipments(address _transporter) external view returns (uint[] memory) {
        uint count = 0;
        
        // Count shipments for this transporter
        for (uint i = 1; i <= shipmentCounter; i++) {
            if (shipments[i].transporter == _transporter) {
                count++;
            }
        }
        
        // Create array of IDs
        uint[] memory result = new uint[](count);
        uint index = 0;
        
        // Fill array with IDs
        for (uint i = 1; i <= shipmentCounter; i++) {
            if (shipments[i].transporter == _transporter) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }

    function getShipmentsByStatus(ShipmentStatus _status) external view returns (uint[] memory) {
        uint count = 0;
        
        // Count shipments with this status
        for (uint i = 1; i <= shipmentCounter; i++) {
            if (shipments[i].status == _status) {
                count++;
            }
        }
        
        // Create array of IDs
        uint[] memory result = new uint[](count);
        uint index = 0;
        
        // Fill array with IDs
        for (uint i = 1; i <= shipmentCounter; i++) {
            if (shipments[i].status == _status) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
    
    function getShipmentsByParty(address _party) external view returns (uint[] memory) {
        uint count = 0;
        
        // Count shipments where party is involved
        for (uint i = 1; i <= shipmentCounter; i++) {
            if (shipments[i].producer == _party || 
                shipments[i].receiver == _party || 
                shipments[i].transporter == _party) {
                count++;
            }
        }
        
        // Create array of IDs
        uint[] memory result = new uint[](count);
        uint index = 0;
        
        // Fill array with IDs
        for (uint i = 1; i <= shipmentCounter; i++) {
            if (shipments[i].producer == _party || 
                shipments[i].receiver == _party || 
                shipments[i].transporter == _party) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
}