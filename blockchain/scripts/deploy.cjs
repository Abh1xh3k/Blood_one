const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying BloodSupplyChain with account: ${deployer.address}`);

  const BloodSupplyChain = await ethers.getContractFactory("BloodSupplyChain");
  
  console.log("Deploying Proxy...");
  const bloodSupplyChain = await upgrades.deployProxy(BloodSupplyChain, [deployer.address], {
    initializer: "initialize",
    kind: "uups",
  });

  await bloodSupplyChain.waitForDeployment();

  const proxyAddress = await bloodSupplyChain.getAddress();
  console.log(`BloodSupplyChain Proxy deployed to: ${proxyAddress}`);
  
  // To get the implementation address
  // const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  // console.log(`Implementation deployed to: ${implementationAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
