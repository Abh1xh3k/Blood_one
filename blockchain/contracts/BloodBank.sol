// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BloodBank {
    address public admin;

    struct BloodPacket {
        string trackingId;
        string donorIdentifier; // Public Key or Aadhaar
        string bloodGroup;
        string location;
        string organization;
        bool isUsed;
        uint256 timestamp;
    }

    mapping(string => BloodPacket) private bloodPackets;
    mapping(string => bool) public trackingIdExists;

    // This lookup table securely mapped Aadhaar -> Tracking ID behind the scenes
    mapping(string => string) private latestDonationByAadhaar;

    event DonorAdded(string trackingId, string donorIdentifier, string bloodGroup);
    event UsageUpdated(string trackingId, string location, string organization, bool isUsed);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Admin function to add a donor and explicitly define Tracking ID
    function addDonor(string memory _trackingId, string memory _donorIdentifier, string memory _bloodGroup) public onlyAdmin {
        require(!trackingIdExists[_trackingId], "Tracking ID already exists");

        bloodPackets[_trackingId] = BloodPacket({
            trackingId: _trackingId,
            donorIdentifier: _donorIdentifier,
            bloodGroup: _bloodGroup,
            location: "Bank Vault", // default location
            organization: "Central Blood Bank",
            isUsed: false,
            timestamp: block.timestamp
        });
        
        trackingIdExists[_trackingId] = true;
        
        // This links the Aadhaar directly to the generated Tracking ID internally!
        latestDonationByAadhaar[_donorIdentifier] = _trackingId;

        emit DonorAdded(_trackingId, _donorIdentifier, _bloodGroup);
    }

    // Admin function to update tracking details via Logistics Tracking ID
    function updateUsage(string memory _trackingId, string memory _location, string memory _organization, bool _isUsed) public onlyAdmin {
        require(trackingIdExists[_trackingId], "Tracking ID does not exist");
        
        BloodPacket storage packet = bloodPackets[_trackingId];
        packet.location = _location;
        packet.organization = _organization;
        packet.isUsed = _isUsed;
        packet.timestamp = block.timestamp;

        emit UsageUpdated(_trackingId, _location, _organization, _isUsed);
    }

    // Viewer function: Donor uses JUST Aadhaar. The contract natively resolves the Tracking ID!
    function getBloodDetailsByAadhaar(string memory _donorIdentifier) public view returns (string memory trackingId, string memory group, string memory location, string memory organization, bool isUsed, uint256 timestamp) {
        string memory trkId = latestDonationByAadhaar[_donorIdentifier];
        require(bytes(trkId).length > 0, "No records found for this Aadhaar Number");
        
        BloodPacket memory packet = bloodPackets[trkId];

        return (packet.trackingId, packet.bloodGroup, packet.location, packet.organization, packet.isUsed, packet.timestamp);
    }
}
