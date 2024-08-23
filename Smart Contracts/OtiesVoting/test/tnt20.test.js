// const { expect } = require("chai");
// const { ethers } = require("hardhat");
// require("dotenv").config();
//
// describe("LockTNT20", function () {
//   this.timeout(60000);
//   let owner;
//   let admin;
//   let user1;
//   let user2;
//   let lockTNT20;
//   let stakeTokenMock;
//   let stakeTokenParams;
//   let TDropStaking;
//
//   const MIN_STAKE_AMOUNT = ethers.utils.parseEther("10");
//
//   beforeEach(async function () {
//     [owner, admin, user1, user2] = await ethers.getSigners();
//
//     const MockERC20 = await ethers.getContractFactory("MockToken");
//     if(process.env.ERC20_ADDRESS !== undefined){
//       stakeTokenMock = MockERC20.attach(process.env.ERC20_ADDRESS);
//     } else {
//       stakeTokenMock = await MockERC20.deploy(owner.address);
//       await stakeTokenMock.deployed();
//       console.log("ERC20 Address:", stakeTokenMock.address);
//     }
//
//
//     const MockERC20Params = await ethers.getContractFactory("MockParam");
//     if(process.env.ERC20_PARAMS_ADDRESS !== undefined){
//       stakeTokenParams = MockERC20Params.attach(process.env.ERC20_PARAMS_ADDRESS);
//     } else {
//       stakeTokenParams = await MockERC20Params.deploy();
//       await stakeTokenParams.deployed();
//       console.log("ERC20 Params Address:", stakeTokenParams.address);
//     }
//
//     const TDropStakingContract = await ethers.getContractFactory("TDropStaking");
//     if(process.env.TDROP_STAKING_ADDRESS !== undefined){
//       TDropStaking = TDropStakingContract.attach(process.env.TDROP_STAKING_ADDRESS);
//     } else {
//       TDropStaking = await TDropStakingContract.deploy(owner.address, admin.address, stakeTokenMock.address, stakeTokenParams.address);
//       await TDropStaking.deployed();
//       console.log("TDrop Staking Address:", TDropStaking.address);
//     }
//
//
//     const LockTNT20 = await ethers.getContractFactory("LockTNT20");
//     if(process.env.LOCKTNT20_ADDRESS !== undefined){
//       lockTNT20 = LockTNT20.attach(process.env.LOCKTNT20_ADDRESS);
//     } else {
//       lockTNT20 = await LockTNT20.deploy(owner.address, admin.address, TDropStaking.address, stakeTokenParams.address, stakeTokenMock.address, MIN_STAKE_AMOUNT);
//       await lockTNT20.deployed();
//       console.log("Lock TNT20 Address:", lockTNT20.address);
//     }
//     console.log("Grant Role")
//     await stakeTokenMock.connect(owner).grantMinterRole(TDropStaking.address)
//     console.log("Transfer Token")
//     await stakeTokenMock.transfer(user1.address, ethers.utils.parseEther("100"));
//     await stakeTokenMock.transfer(user2.address, ethers.utils.parseEther("200"));
//     console.log("Approve Tokens")
//     await stakeTokenMock.connect(user1).approve(lockTNT20.address, ethers.utils.parseEther("100"));
//     await stakeTokenMock.connect(user2).approve(lockTNT20.address, ethers.utils.parseEther("200"));
//   });
//
//   it("should lock tokens into the staking contract", async function () {
//     const amountToLock = ethers.utils.parseEther("50");
//
//     await lockTNT20.connect(user1).lockTNT20(amountToLock)
//
//     expect(await lockTNT20.userLockInfo(user1.address)).to.equal(amountToLock);
//   });
//
//
//   it("should unlock tokens from the staking contract", async function () {
//     const amountToLock = ethers.utils.parseEther("50");
//     const amountToUnlock = ethers.utils.parseEther("30");
//
//     await lockTNT20.connect(user1).lockTNT20(amountToLock);
//     await lockTNT20.connect(user1).unlockTNT20(amountToUnlock);
//   });
// });
