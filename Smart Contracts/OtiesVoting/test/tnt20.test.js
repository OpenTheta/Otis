const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LockTNT20", function () {
  let owner;
  let admin;
  let user1;
  let user2;
  let lockTNT20;
  let stakeTokenMock;
  let stakeTokenParams;
  let TDropStaking;

  const MIN_STAKE_AMOUNT = ethers.utils.parseEther("10");

  beforeEach(async function () {
    [owner, admin, user1, user2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockToken");
    stakeTokenMock = await MockERC20.deploy(owner.address);
    await stakeTokenMock.deployed();

    const MockERC20Params = await ethers.getContractFactory("MockParam");
    stakeTokenParams = await MockERC20Params.deploy();
    await stakeTokenParams.deployed();

    const TDropStakingContract = await ethers.getContractFactory("TDropStaking");
    TDropStaking = await TDropStakingContract.deploy(owner.address, admin.address, stakeTokenMock.address, stakeTokenParams.address);
    await TDropStaking.deployed();

    const LockTNT20 = await ethers.getContractFactory("LockTNT20");
    lockTNT20 = await LockTNT20.deploy(owner.address, admin.address, TDropStaking.address, stakeTokenParams.address, stakeTokenMock.address, MIN_STAKE_AMOUNT);
    await lockTNT20.deployed();

    await stakeTokenMock.connect(owner).grantMinterRole(TDropStaking.address)
    await stakeTokenMock.transfer(user1.address, ethers.utils.parseEther("100"));
    await stakeTokenMock.connect(user1).approve(lockTNT20.address, ethers.utils.parseEther("100"));
    await stakeTokenMock.transfer(user2.address, ethers.utils.parseEther("200"));
    await stakeTokenMock.connect(user2).approve(lockTNT20.address, ethers.utils.parseEther("200"));
  });

  it("should lock tokens into the staking contract", async function () {
    const amountToLock = ethers.utils.parseEther("50");

    await lockTNT20.connect(user1).lockTNT20(amountToLock)

    expect(await lockTNT20.userLockInfo(user1.address)).to.equal(amountToLock);
  });


  it("should unlock tokens from the staking contract", async function () {
    const amountToLock = ethers.utils.parseEther("50");
    const amountToUnlock = ethers.utils.parseEther("30");

    await lockTNT20.connect(user1).lockTNT20(amountToLock);
    await lockTNT20.connect(user1).unlockTNT20(amountToUnlock);
  });
});
