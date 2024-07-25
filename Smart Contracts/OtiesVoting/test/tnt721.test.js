const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("LockTNT721", function () {
  let owner;
  let admin;
  let user1;
  let user2;
  let lockTNT721;
  let tnt721ContractMock;

  const TOKEN_ID_1 = 1;
  const TOKEN_ID_2 = 2;
  const TOKEN_ID_3 = 3;

  beforeEach(async function () {
    [owner, admin, user1, user2] = await ethers.getSigners();

    const TNT721Mock = await ethers.getContractFactory("TNT721Mock");
    tnt721ContractMock = await TNT721Mock.deploy();
    await tnt721ContractMock.deployed();

    const LockTNT721 = await ethers.getContractFactory("LockTNT721");
    lockTNT721 = await LockTNT721.deploy(owner.address, admin.address);
    await lockTNT721.deployed();

    await lockTNT721.grantAdminRole(admin.address);

    await tnt721ContractMock.mint(user1.address, TOKEN_ID_1);
    await tnt721ContractMock.mint(user1.address, TOKEN_ID_2);
    await tnt721ContractMock.mint(user2.address, TOKEN_ID_3);
  });

  it("should lock TNT721 tokens into the contract", async function () {
    await tnt721ContractMock.connect(user1).setApprovalForAll(lockTNT721.address, true);
  
    await lockTNT721.connect(user1).lockTNT721(tnt721ContractMock.address, [TOKEN_ID_1, TOKEN_ID_2]);
  
    const deposits = await lockTNT721.depositsOf(user1.address, tnt721ContractMock.address);
  
    const depositIds = deposits.map(id => id.toNumber());
    expect(depositIds).to.include.members([TOKEN_ID_1, TOKEN_ID_2]);
  
    const totalStaked = await lockTNT721.totalTNT721StakedByUser(user1.address);
    expect(totalStaked).to.equal(2);
  });
  
  it("should unlock TNT721 tokens from the contract", async function () {
    await tnt721ContractMock.connect(user1).setApprovalForAll(lockTNT721.address, true);
    await lockTNT721.connect(user1).lockTNT721(tnt721ContractMock.address, [TOKEN_ID_1, TOKEN_ID_2]);

    await lockTNT721.connect(user1).unlockTNT721(tnt721ContractMock.address, [TOKEN_ID_1]);

    const deposits = await lockTNT721.depositsOf(user1.address, tnt721ContractMock.address);

    const depositIds = deposits.map(id => id.toNumber());
    expect(depositIds).to.not.include(TOKEN_ID_1);

    const totalStaked = await lockTNT721.totalTNT721StakedByUser(user1.address);
    expect(totalStaked).to.equal(1);
  });

  it("should allow admin to pause and unpause the contract", async function () {
    await expect(lockTNT721.connect(admin).pause())
      .to.emit(lockTNT721, "Paused")
      .withArgs(admin.address);

      await expect(lockTNT721.connect(user1).lockTNT721(tnt721ContractMock.address, [TOKEN_ID_1])).to.be.revertedWith(
      "Pausable: paused"
    );
    await expect(lockTNT721.connect(admin).unpause())
      .to.emit(lockTNT721, "Unpaused")
      .withArgs(admin.address);

    await tnt721ContractMock.connect(user1).setApprovalForAll(lockTNT721.address, true);
    await lockTNT721.connect(user1).lockTNT721(tnt721ContractMock.address, [TOKEN_ID_1]);
  });

  it("should allow admin to grant and revoke admin role", async function () {
    const isAdminBefore = await lockTNT721.hasRole(await lockTNT721.DEFAULT_ADMIN_ROLE(), owner.address);
    expect(isAdminBefore).to.be.true;
    
    await lockTNT721.connect(owner).grantAdminRole(user2.address);

    const isAdminAfter = await lockTNT721.hasRole(await lockTNT721.ADMIN_ROLE(), user2.address);
    expect(isAdminAfter).to.be.true;

    await lockTNT721.connect(owner).revokeAdminRole(user2.address);

    const isAdminRevoked = await lockTNT721.hasRole(await lockTNT721.DEFAULT_ADMIN_ROLE(), user2.address);
    expect(isAdminRevoked).to.be.false;
  });
});

