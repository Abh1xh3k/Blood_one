const hre = require("hardhat");

async function main() {
  const BloodBank = await hre.ethers.getContractFactory("BloodBank");
  console.log("Deploying BloodBank...");
  const bloodBank = await BloodBank.deploy();

  await bloodBank.waitForDeployment();

  console.log(`BloodBank contract deployed to: ${await bloodBank.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
