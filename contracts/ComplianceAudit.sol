// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserManagement.sol";
import "./RecyclingManagement.sol";
import "./eWasteTracking.sol";
import "./LogisticsTracking.sol";

contract ComplianceAudit {
    UserManagement public userManagement;
    RecyclingManagement public recycler;
    eWasteTracking public eWasteTracker;
    LogisticsTracking public logisticsTracker;

    enum ComplianceStatus { Pending, Compliant, NonCompliant, Warning }

    struct AuditRecord {
        uint id;
        uint wasteId;
        ComplianceStatus complianceStatus;
        string details;
        string evidenceHash;
        address auditor;
        uint256 auditedAt;
    }

    mapping(uint => AuditRecord) public audits;
    uint public auditCounter;
    
    // Events
    event AuditLogged(
        uint id,
        uint wasteId, 
        ComplianceStatus status, 
        string details,
        address indexed auditor,
        uint256 auditedAt
    );
    event NonComplianceLogged(
        uint wasteId, 
        address indexed responsible, 
        string details, 
        address indexed auditor
    );
    event CertificateIssued(
        uint wasteId, 
        string certificateHash, 
        address indexed recipient, 
        uint256 issuedAt
    );

    constructor(
        address _userManagementAddress,
        address _recyclerAddress,
        address _eWasteTrackerAddress,
        address _logisticsTrackerAddress
    ) {
        userManagement = UserManagement(_userManagementAddress);
        recycler = RecyclingManagement(_recyclerAddress);
        eWasteTracker = eWasteTracking(_eWasteTrackerAddress);
        logisticsTracker = LogisticsTracking(_logisticsTrackerAddress);
        auditCounter = 0;
    }

    modifier onlyRegulator() {
        require(
            userManagement.getUserRole(msg.sender) == UserManagement.Role.Regulator,
            "Unauthorized: Only regulators can perform this action."
        );
        _;
    }

    function logAudit(
        uint _wasteId, 
        ComplianceStatus _status, 
        string memory _details,
        string memory _evidenceHash
    ) external onlyRegulator {
        // Verify waste item exists
        (
            uint wasteId,
            , // wasteType - unused
            , // origin - unused
            , // quantity - unused
            , // description - unused
            , // imageHash - unused
            uint256 deadline,
            , // loggedAt - unused
            address producer,
            bool isProcessed,
            // recyclingMethod - unused
        ) = eWasteTracker.getWasteItem(_wasteId);
        
        require(wasteId > 0, "Waste item does not exist.");
        
        // Get recycling data if available
        address recyclerAddress;
        uint256 recycledAt;
        try recycler.getRecycledItem(_wasteId) returns (
            uint _wasteId_unused,
            string memory _method_unused,
            address _recycler,
            RecyclingManagement.RecyclingStatus _status_unused,
            uint _progressPercentage_unused,
            string[] memory _materialRecovered_unused,
            uint[] memory _materialQuantities_unused,
            string memory _evidenceHash_unused,
            uint256 _startedAt_unused,
            uint256 _completedAt
        ) {
            recyclerAddress = _recycler;
            recycledAt = _completedAt;
        } catch {
            // No recycling data, which is fine
        }
        
        auditCounter++;
        
        // Create audit record
        audits[auditCounter] = AuditRecord({
            id: auditCounter,
            wasteId: _wasteId,
            complianceStatus: _status,
            details: _details,
            evidenceHash: _evidenceHash,
            auditor: msg.sender,
            auditedAt: block.timestamp
        });
        
        emit AuditLogged(
            auditCounter,
            _wasteId, 
            _status, 
            _details,
            msg.sender,
            block.timestamp
        );
        
        // Check for non-compliance situations
        if (_status == ComplianceStatus.NonCompliant) {
            address responsible = producer; // Default to producer
            
            if (recyclerAddress != address(0) && recycledAt > deadline) {
                // Recycler missed deadline
                responsible = recyclerAddress;
                emit NonComplianceLogged(
                    _wasteId, 
                    responsible, 
                    "Recycling missed deadline", 
                    msg.sender
                );
            } else {
                // Producer is responsible for other non-compliance
                emit NonComplianceLogged(
                    _wasteId, 
                    responsible, 
                    _details, 
                    msg.sender
                );
            }
        }
    }

    function issueCertificate(
        uint _wasteId, 
        string memory _certificateHash, 
        address _recipient
    ) external onlyRegulator {
        require(
            _recipient != address(0), 
            "Invalid recipient address"
        );
        
        // Verify waste is processed
        (
            , // id - unused
            , // wasteType - unused
            , // origin - unused
            , // quantity - unused
            , // description - unused
            , // imageHash - unused
            , // deadline - unused
            , // loggedAt - unused
            , // producer - unused
            bool isProcessed,
            // recyclingMethod - unused
        ) = eWasteTracker.getWasteItem(_wasteId);
        
        require(isProcessed, "Cannot issue certificate: waste not fully processed");
        
        // Check if there's an audit record for compliance
        bool foundCompliantAudit = false;
        for (uint i = 1; i <= auditCounter; i++) {
            if (audits[i].wasteId == _wasteId && audits[i].complianceStatus == ComplianceStatus.Compliant) {
                foundCompliantAudit = true;
                break;
            }
        }
        
        require(foundCompliantAudit, "Cannot issue certificate: no compliant audit record");
        
        emit CertificateIssued(
            _wasteId, 
            _certificateHash, 
            _recipient, 
            block.timestamp
        );
    }

    function getAuditsByWasteId(uint _wasteId) external view returns (uint[] memory) {
        uint count = 0;
        
        // Count audits for this waste
        for (uint i = 1; i <= auditCounter; i++) {
            if (audits[i].wasteId == _wasteId) {
                count++;
            }
        }
        
        // Create array of IDs
        uint[] memory result = new uint[](count);
        uint index = 0;
        
        // Fill array with IDs
        for (uint i = 1; i <= auditCounter; i++) {
            if (audits[i].wasteId == _wasteId) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }

    function getAuditsByStatus(ComplianceStatus _status) external view returns (uint[] memory) {
        uint count = 0;
        
        // Count audits with this status
        for (uint i = 1; i <= auditCounter; i++) {
            if (audits[i].complianceStatus == _status) {
                count++;
            }
        }
        
        // Create array of IDs
        uint[] memory result = new uint[](count);
        uint index = 0;
        
        // Fill array with IDs
        for (uint i = 1; i <= auditCounter; i++) {
            if (audits[i].complianceStatus == _status) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }

    function getAuditDetails(uint _auditId) external view returns (
        uint id,
        uint wasteId,
        ComplianceStatus complianceStatus,
        string memory details,
        string memory evidenceHash,
        address auditor,
        uint256 auditedAt
    ) {
        require(_auditId > 0 && _auditId <= auditCounter, "Invalid audit ID");
        
        AuditRecord memory audit = audits[_auditId];
        
        return (
            audit.id,
            audit.wasteId,
            audit.complianceStatus,
            audit.details,
            audit.evidenceHash,
            audit.auditor,
            audit.auditedAt
        );
    }
}