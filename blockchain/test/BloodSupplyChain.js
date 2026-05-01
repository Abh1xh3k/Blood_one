const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("BloodSupplyChain", function () {
  let BloodSupplyChain;
  let bloodSupplyChain;
  let owner;
  let bloodBank;
  let hospital;
  let unauth;

  const BLOOD_BANK_ROLE = ethers.id("BLOOD_BANK_ROLE");
  const HOSPITAL_ROLE = ethers.id("HOSPITAL_ROLE");

  const donorHash = ethers.id("donor_aadhaar_secret");
  const trackingId = "TRK-12345678";
  const bloodGroup = "O+";
  const initLocation = "Bank Vault";
  const organization = "Central Blood Bank";
  const metadataCID = "QmTestHash123";

  beforeEach(async function () {
    [owner, bloodBank, hospital, unauth] = await ethers.getSigners();

    BloodSupplyChain = await ethers.getContractFactory("BloodSupplyChain");
    
    // Deploy proxy
    bloodSupplyChain = await upgrades.deployProxy(BloodSupplyChain, [owner.address], {
      initializer: "initialize",
      kind: "uups",
    });
    
    // Using Ethers v6, deployProxy waits for deployment automatically, but wait for target
    await bloodSupplyChain.waitForDeployment();

    // Grant roles
    await bloodSupplyChain.connect(owner).grantRole(BLOOD_BANK_ROLE, bloodBank.address);
    await bloodSupplyChain.connect(owner).grantRole(HOSPITAL_ROLE, hospital.address);
  });

  describe("Deployment & Access Control", function () {
    it("Should set the right admin", async function () {
      const DEFAULT_ADMIN_ROLE = await bloodSupplyChain.DEFAULT_ADMIN_ROLE();
      expect(await bloodSupplyChain.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should correctly grant roles", async function () {
      expect(await bloodSupplyChain.hasRole(BLOOD_BANK_ROLE, bloodBank.address)).to.be.true;
      expect(await bloodSupplyChain.hasRole(HOSPITAL_ROLE, hospital.address)).to.be.true;
    });
  });

  describe("Packet Registration", function () {
    it("Should allow Blood Bank to register a packet", async function () {
      await expect(
        bloodSupplyChain.connect(bloodBank).registerPacket(
          trackingId, donorHash, bloodGroup, initLocation, organization, metadataCID
        )
      ).to.emit(bloodSupplyChain, "PacketRegistered")
       .withArgs(trackingId, donorHash, bloodGroup, (timestamp) => timestamp > 0);

      const packet = await bloodSupplyChain.getPacketDetails(trackingId);
      expect(packet.trackingId).to.equal(trackingId);
      expect(packet.donorHash).to.equal(donorHash);
      expect(packet.status).to.equal(0); // 0 = Active
    });

    it("Should prevent unauthorized users from registering", async function () {
      await expect(
        bloodSupplyChain.connect(unauth).registerPacket(
          trackingId, donorHash, bloodGroup, initLocation, organization, metadataCID
        )
      ).to.be.revertedWithCustomError(bloodSupplyChain, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Logistics Updates", function () {
    beforeEach(async function () {
      await bloodSupplyChain.connect(bloodBank).registerPacket(
        trackingId, donorHash, bloodGroup, initLocation, organization, metadataCID
      );
    });

    it("Should allow Hospital to update logistics and consume", async function () {
      const newLocation = "City Hospital Ward A";
      const newOrg = "City Hospital";
      
      // Update to InTransit (1)
      await expect(
        bloodSupplyChain.connect(hospital).updateLogistics(trackingId, newLocation, newOrg, 1)
      ).to.emit(bloodSupplyChain, "LocationUpdated");

      let packet = await bloodSupplyChain.getPacketDetails(trackingId);
      expect(packet.status).to.equal(1);
      expect(packet.location).to.equal(newLocation);

      // Update to Consumed (2)
      await expect(
        bloodSupplyChain.connect(hospital).updateLogistics(trackingId, newLocation, newOrg, 2)
      ).to.emit(bloodSupplyChain, "PacketConsumed")
       .withArgs(trackingId, newOrg, (timestamp) => timestamp > 0);

      packet = await bloodSupplyChain.getPacketDetails(trackingId);
      expect(packet.status).to.equal(2);
    });

    it("Should prevent updates to already consumed packets", async function () {
      await bloodSupplyChain.connect(hospital).updateLogistics(trackingId, "Loc", "Org", 2); // Consumed
      
      await expect(
        bloodSupplyChain.connect(hospital).updateLogistics(trackingId, "Loc2", "Org2", 1)
      ).to.be.revertedWith("Packet no longer active");
    });
  });
});
