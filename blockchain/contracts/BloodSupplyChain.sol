// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract BloodSupplyChain is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant BLOOD_BANK_ROLE = keccak256("BLOOD_BANK_ROLE");
    bytes32 public constant HOSPITAL_ROLE = keccak256("HOSPITAL_ROLE");

    enum PacketStatus { Active, InTransit, Consumed, Discarded }

    struct BloodPacket {
        string trackingId;
        bytes32 donorHash; // Hashed Aadhaar off-chain to protect PII
        string bloodGroup;
        string location;
        string organization;
        string metadataCID; // IPFS CID for extra metadata
        PacketStatus status;
        uint32 timestamp;
    }

    mapping(string => BloodPacket) private bloodPackets;
    mapping(string => bool) public trackingIdExists;
    mapping(bytes32 => string) private latestPacketByDonor;

    event PacketRegistered(string trackingId, bytes32 indexed donorHash, string bloodGroup, uint32 timestamp);
    event LocationUpdated(string trackingId, string location, string organization, PacketStatus status, uint32 timestamp);
    event PacketConsumed(string trackingId, string hospital, uint32 timestamp);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address defaultAdmin) initializer public {
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(DEFAULT_ADMIN_ROLE)
        override
    {}

    function registerPacket(
        string memory _trackingId,
        bytes32 _donorHash,
        string memory _bloodGroup,
        string memory _location,
        string memory _organization,
        string memory _metadataCID
    ) public onlyRole(BLOOD_BANK_ROLE) {
        require(!trackingIdExists[_trackingId], "Tracking ID already exists");

        bloodPackets[_trackingId] = BloodPacket({
            trackingId: _trackingId,
            donorHash: _donorHash,
            bloodGroup: _bloodGroup,
            location: _location,
            organization: _organization,
            metadataCID: _metadataCID,
            status: PacketStatus.Active,
            timestamp: uint32(block.timestamp)
        });

        trackingIdExists[_trackingId] = true;
        latestPacketByDonor[_donorHash] = _trackingId;

        emit PacketRegistered(_trackingId, _donorHash, _bloodGroup, uint32(block.timestamp));
    }

    function getPacketByDonor(bytes32 _donorHash) public view returns (BloodPacket memory) {
        string memory tid = latestPacketByDonor[_donorHash];
        require(bytes(tid).length > 0, "No packet found for this donor");
        return bloodPackets[tid];
    }

    function updateLogistics(
        string memory _trackingId,
        string memory _location,
        string memory _organization,
        PacketStatus _status
    ) public {
        require(hasRole(BLOOD_BANK_ROLE, msg.sender) || hasRole(HOSPITAL_ROLE, msg.sender), "Caller is not authorized");
        require(trackingIdExists[_trackingId], "Tracking ID does not exist");
        require(bloodPackets[_trackingId].status != PacketStatus.Consumed && bloodPackets[_trackingId].status != PacketStatus.Discarded, "Packet no longer active");

        BloodPacket storage packet = bloodPackets[_trackingId];
        packet.location = _location;
        packet.organization = _organization;
        packet.status = _status;
        packet.timestamp = uint32(block.timestamp);

        emit LocationUpdated(_trackingId, _location, _organization, _status, uint32(block.timestamp));

        if (_status == PacketStatus.Consumed) {
            emit PacketConsumed(_trackingId, _organization, uint32(block.timestamp));
        }
    }

    function getPacketDetails(string memory _trackingId) public view returns (BloodPacket memory) {
        require(trackingIdExists[_trackingId], "Tracking ID does not exist");
        return bloodPackets[_trackingId];
    }
}
