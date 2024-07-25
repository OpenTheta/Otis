// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  // Get the Address from Ganache Chain to deploy.
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address", deployer.address);

  LockTNT20 = await ethers.getContractFactory('LockTNT20');
  let t = await LockTNT20.deploy("", "", "800");
  console.log("t Deployed Address:", t.address);




  const votingPeriod = 3600; // Example: 7 days in seconds
  const proposalPeriod = 600; // Example: 2 days in seconds
  const splitTFuelOwnersRatio = 300; // Example: 30%
  const potProposalRewardRatio = 500; // Example: 50%
  const maxOptionValue = 5; // Example: Max 5 voting options
  const tFuelFeeWalletAddress = ""; // Example: Deployer's address
  const rewardToken = '0x...'; // Example: Address of the reward token
  const defaultAdmin = ""; // Example: Admin address
  const admin = ""; // Example: Admin address

  // Deploying the contract
  const V4R = await ethers.getContractFactory('V4R');
  const v4r = await V4R.deploy(
    votingPeriod,
    proposalPeriod,
    splitTFuelOwnersRatio,
    potProposalRewardRatio,
    maxOptionValue,
    tFuelFeeWalletAddress,
    rewardToken,
    defaultAdmin,
    admin
  );

  await v4r.deployed();

  console.log('V4R contract deployed to:', v4r.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
