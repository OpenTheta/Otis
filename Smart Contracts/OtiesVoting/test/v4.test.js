const { expect } = require("chai");
const { ethers } = require("hardhat");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("V4R:TNT20", function () {
  let V4R;
  let v4r;
  let owner;
  let admin;
  let lockTNT20;
  let tFuelFeeWalletAddress;
  let token_1;
  let token_2;
  let token_3;
  let lockTNT20Token1;
  let lockTNT20Token2;
  let lockTNT20Token3;

  const votingPeriod = 36000;
  const proposalPeriod = 1000;
  const splitTFuelOwnersRatio = 300; // Example: 30%
  const potProposalRewardRatio = 500; // Example: 50%
  const maxOptionValue = 2; // Example: Max 5 voting options

  let rewardToken;
  const MIN_STAKE_AMOUNT = ethers.utils.parseEther("10");

  beforeEach(async function () {
    [
      owner,
      admin,
      tFuelFeeWalletAddress,
      proposer1,
      proposer2,
      voter1,
      voter2,
    ] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockToken");
    rewardToken = await MockERC20.deploy(owner.address);
    await rewardToken.deployed();

    const token1 = await ethers.getContractFactory("MockSampleToken");
    token_1 = await token1.deploy(proposer1.address);
    await token_1.deployed();

    const token2 = await ethers.getContractFactory("MockSampleToken");
    token_2 = await token2.deploy(proposer1.address);
    await token_2.deployed();

    const token3 = await ethers.getContractFactory("MockSampleToken");
    token_3 = await token3.deploy(proposer1.address);
    await token_3.deployed();

    const MockERC20Params = await ethers.getContractFactory("MockParam");
    stakeTokenParams = await MockERC20Params.deploy();
    await stakeTokenParams.deployed();

    const TDropStakingContract = await ethers.getContractFactory(
      "TDropStaking"
    );
    TDropStaking = await TDropStakingContract.deploy(
      owner.address,
      admin.address,
      rewardToken.address,
      stakeTokenParams.address
    );
    await TDropStaking.deployed();

    const LockTNT20 = await ethers.getContractFactory("LockTNT20");
    lockTNT20 = await LockTNT20.deploy(
      owner.address,
      admin.address,
      TDropStaking.address,
      stakeTokenParams.address,
      rewardToken.address,
      MIN_STAKE_AMOUNT
    );
    await lockTNT20.deployed();

    const LockTNT20_token1 = await ethers.getContractFactory("MockLockTNT20");
    lockTNT20Token1 = await LockTNT20_token1.deploy(
      owner.address,
      admin.address
    );
    await lockTNT20Token1.deployed();

    const LockTNT20_token2 = await ethers.getContractFactory("MockLockTNT20");
    lockTNT20Token2 = await LockTNT20_token2.deploy(
      owner.address,
      admin.address
    );
    await lockTNT20Token2.deployed();

    const LockTNT20_token3 = await ethers.getContractFactory("MockLockTNT20");
    lockTNT20Token3 = await LockTNT20_token3.deploy(
      owner.address,
      admin.address
    );
    await lockTNT20Token3.deployed();

    // Deploying V4R contract
    V4R = await ethers.getContractFactory("V4R");
    v4r = await V4R.deploy(
      votingPeriod,
      proposalPeriod,
      splitTFuelOwnersRatio,
      potProposalRewardRatio,
      maxOptionValue,
      tFuelFeeWalletAddress.address,
      rewardToken.address,
      owner.address,
      admin.address
    );

    // Grant ADMIN_ROLE to admin
    await v4r.grantRole(await v4r.ADMIN_ROLE(), admin.address);

    await v4r.connect(admin).updateProposalCreatorList(proposer1.address, true);
    await v4r.connect(admin).updateProposalCreatorList(proposer2.address, true);

    await lockTNT20.connect(admin).setV4rAddress(v4r.address);
    await rewardToken.connect(owner).grantMinterRole(TDropStaking.address);
    await rewardToken.transfer(
      proposer1.address,
      ethers.utils.parseEther("100")
    );
    await rewardToken
      .connect(proposer1)
      .approve(lockTNT20.address, ethers.utils.parseEther("50"));
    await rewardToken.transfer(voter1.address, ethers.utils.parseEther("100"));
    await rewardToken
      .connect(voter1)
      .approve(lockTNT20.address, ethers.utils.parseEther("50"));

    await token_1.transfer(proposer1.address, ethers.utils.parseEther("100"));
    await token_2.transfer(proposer1.address, ethers.utils.parseEther("100"));
    await token_3.transfer(proposer1.address, ethers.utils.parseEther("100"));
    await token_1.transfer(proposer2.address, ethers.utils.parseEther("100"));
    await token_2.transfer(proposer2.address, ethers.utils.parseEther("100"));
    await token_3.transfer(proposer2.address, ethers.utils.parseEther("100"));
    await token_1.transfer(voter2.address, ethers.utils.parseEther("100"));
    await token_1.transfer(voter1.address, ethers.utils.parseEther("100"));
    await token_2.transfer(voter2.address, ethers.utils.parseEther("100"));
    await token_2.transfer(voter1.address, ethers.utils.parseEther("100"));
    await token_3.transfer(voter2.address, ethers.utils.parseEther("100"));
    await token_3.transfer(voter1.address, ethers.utils.parseEther("100"));

    await token_1
      .connect(proposer1)
      .approve(lockTNT20Token1.address, ethers.utils.parseEther("100"));

    // set token info
    await v4r
      .connect(admin)
      .setTokenInfo(rewardToken.address, 300, lockTNT20.address, true);
    await v4r
      .connect(admin)
      .setTokenInfo(token_1.address, 100, lockTNT20Token1.address, true);
    await v4r
      .connect(admin)
      .setTokenInfo(token_2.address, 200, lockTNT20Token2.address, true);
    await v4r
      .connect(admin)
      .setTokenInfo(token_3.address, 300, lockTNT20Token3.address, true);
  });

  describe("Proposal Creation and Voting and cancellation", function () {
    it("Should create a new proposal", async function () {
      const amountToLock = ethers.utils.parseEther("50");

      await lockTNT20.connect(proposer1).lockTNT20(amountToLock);

      expect(await lockTNT20.userLockInfo(proposer1.address)).to.equal(
        amountToLock
      );
      await helpers.mine(1000);

      await owner.sendTransaction({
        to: v4r.address,
        value: ethers.utils.parseEther("1.0"),
      });

      const description = "Sample proposal description";
      const votingOptions = ["Option A", "Option B"];

      // Propose
      await v4r
        .connect(proposer1)
        .propose(rewardToken.address, [rewardToken.address], description, votingOptions);

      // Check proposal details
      const latestProposalId = await v4r.latestProposalIds(proposer1.address);
      const proposal = await v4r.proposals(latestProposalId);

      expect(proposal.description).to.equal(description);

      // Propose
      await v4r
        .connect(proposer2)
        .propose(rewardToken.address, [rewardToken.address], description, votingOptions);

      // Check proposal details
      const latestProposalId2 = await v4r.latestProposalIds(proposer2.address);
      const proposal2 = await v4r.proposals(latestProposalId2);

      expect(proposal2.description).to.equal(description);
    });

    it("Should allow voting on a proposal", async function () {
      const amountToLock = ethers.utils.parseEther("50");

      await lockTNT20.connect(proposer1).lockTNT20(amountToLock);

      await lockTNT20.connect(voter1).lockTNT20(amountToLock);

      expect(await lockTNT20.userLockInfo(proposer1.address)).to.equal(
        amountToLock
      );
      
      await helpers.mine(1000);

      const description = "Sample proposal description";
      const votingOptions = ["Option A", "Option B"];

      // Propose
      await v4r
        .connect(proposer1)
        .propose(rewardToken.address, [rewardToken.address], description, votingOptions);

      const latestProposalId = await v4r.latestProposalIds(proposer1.address);

      await ethers.provider.send("evm_increaseTime", [30000]);
      await v4r.connect(voter1).castVote(latestProposalId, 0);

      // Check vote details
      const voter1Receipt = await v4r
        .connect(voter1)
        .getReceipt(latestProposalId, voter1.address);

      expect(voter1Receipt.hasVoted).to.be.true;
      expect(voter1Receipt.option).to.equal(0);
      expect(voter1Receipt.votes).to.be.gt(0); // Check actual votes
    });

    it("Should reverted if voter give 2 votes on same proposal", async function () {
      const amountToLock = ethers.utils.parseEther("50");

      await lockTNT20.connect(proposer1).lockTNT20(amountToLock);

      await lockTNT20.connect(voter1).lockTNT20(amountToLock);

      expect(await lockTNT20.userLockInfo(proposer1.address)).to.equal(
        amountToLock
      );

      await helpers.mine(1000);

      const description = "Sample proposal description";
      const votingOptions = ["Option A", "Option B"];

      // Propose
      await v4r
        .connect(proposer1)
        .propose(rewardToken.address, [rewardToken.address], description, votingOptions);

      const latestProposalId = await v4r.latestProposalIds(proposer1.address);

      await ethers.provider.send("evm_increaseTime", [30000]);
      await v4r.connect(voter1).castVote(latestProposalId, 0);
      await expect(
        v4r.connect(voter1).castVote(latestProposalId, 0)
      ).to.be.revertedWith("V4R: Voter already voted");
    });

    it("Should reverted if Invalid options or description", async function () {
      const amountToLock = ethers.utils.parseEther("50");

      await lockTNT20.connect(proposer1).lockTNT20(amountToLock);

      await lockTNT20.connect(voter1).lockTNT20(amountToLock);

      expect(await lockTNT20.userLockInfo(proposer1.address)).to.equal(
        amountToLock
      );

      await helpers.mine(1000);

      const description = "Sample proposal description";
      const votingOptions = ["Option A", "Option B", "Option B"];

      await expect(
        v4r
          .connect(proposer1)
          .propose(rewardToken.address, [rewardToken.address], description, votingOptions)
      ).to.be.revertedWith("V4R: Invalid Description or votingOptions");
    });

    it("Should pause and unpause the contract", async function () {
      // Pause contract
      await v4r.connect(admin).pause();
      expect(await v4r.paused()).to.be.true;

      // Unpause contract
      await v4r.connect(admin).unpause();
      expect(await v4r.paused()).to.be.false;
    });

    it("Should prevent proposing when paused", async function () {
      const amountToLock = ethers.utils.parseEther("50");

      await lockTNT20.connect(proposer1).lockTNT20(amountToLock);

      expect(await lockTNT20.userLockInfo(proposer1.address)).to.equal(
        amountToLock
      );

      await helpers.mine(1000);

      const description = "Sample proposal description";
      const votingOptions = ["Option A", "Option B"];

      // Pause contract
      await v4r.connect(admin).pause();

      expect(await v4r.paused()).to.be.true;

      // Try to propose
      await expect(
        v4r
          .connect(proposer1)
          .propose(rewardToken.address, [rewardToken.address], description, votingOptions)
      ).to.be.revertedWith("Pausable: paused");
      // Unpause contract
      await v4r.connect(admin).unpause();

      // Propose successfully
      await v4r
        .connect(proposer1)
        .propose(rewardToken.address, [rewardToken.address], description, votingOptions);
      const latestProposalId = await v4r.latestProposalIds(proposer1.address);
      const proposal = await v4r.proposals(latestProposalId);
      expect(proposal.description).to.equal(description);

      expect(await v4r.getProposalVotingOptions(proposal.id)).to.deep.equal(votingOptions);
    });
  });

  describe("Proposal Creation and Voting and claming with three diffrent tokens", function () {
    it("Should create a new proposal", async function () {
      const amountToLock = ethers.utils.parseEther("50");

      await lockTNT20.connect(proposer1).lockTNT20(amountToLock);
      await lockTNT20Token1.connect(proposer2).lockTNT20(amountToLock);

      expect(await lockTNT20.userLockInfo(proposer1.address)).to.equal(
        amountToLock
      );

      await helpers.mine(1000);

      await owner.sendTransaction({
        to: v4r.address,
        value: ethers.utils.parseEther("1.0"),
      });

      const description = "Sample proposal description";
      const votingOptions = ["Option A", "Option B"];

      const description_2 = "Sample proposal description and voting options";
      const votingOptions_2 = ["Option A", "Option B"];

      // Propose
      await v4r
        .connect(proposer1)
        .propose(
          rewardToken.address,
          [rewardToken.address, token_1.address, token_2.address],
          description,
          votingOptions
        );

      // Check proposal details
      const latestProposalId_1 = await v4r.latestProposalIds(proposer1.address);
      const proposal_1 = await v4r.proposals(latestProposalId_1);

      expect(proposal_1.description).to.equal(description);

      await v4r
        .connect(proposer2)
        .propose(
          rewardToken.address,
          [rewardToken.address, token_1.address],
          description_2,
          votingOptions_2
        );

      // Check proposal details
      const latestProposalId_2 = await v4r.latestProposalIds(proposer2.address);
      const proposal_2 = await v4r.proposals(latestProposalId_2);

      expect(proposal_2.description).to.equal(description_2);
    });

    it("Should allow voting on a 2 proposals", async function () {
      const amountToLock = ethers.utils.parseEther("50");

      await lockTNT20.connect(proposer1).lockTNT20(amountToLock);
      await lockTNT20Token1.connect(voter1).lockTNT20(amountToLock);
      await lockTNT20Token1.connect(proposer2).lockTNT20(amountToLock);

      expect(await lockTNT20.userLockInfo(proposer1.address)).to.equal(
        amountToLock
      );

      await helpers.mine(1000);
      await owner.sendTransaction({
        to: v4r.address,
        value: ethers.utils.parseEther("1.0"),
      });

      const description = "Sample proposal description";
      const votingOptions = ["Option A", "Option B"];

      const description_2 = "Sample proposal description and voting options";
      const votingOptions_2 = ["Option A", "Option B"];

      // Propose
      await v4r
        .connect(proposer1)
        .propose(
          rewardToken.address,
          [rewardToken.address, token_1.address, token_2.address],
          description,
          votingOptions
        );

      // Check proposal details
      const latestProposalId_1 = await v4r.latestProposalIds(proposer1.address);
      const proposal_1 = await v4r.proposals(latestProposalId_1);

      expect(proposal_1.description).to.equal(description);

      await v4r
        .connect(proposer2)
        .propose(
          rewardToken.address,
          [rewardToken.address, token_1.address],
          description_2,
          votingOptions_2
        );

      // Check proposal details
      const latestProposalId_2 = await v4r.latestProposalIds(proposer2.address);
      const proposal_2 = await v4r.proposals(latestProposalId_2);

      expect(proposal_2.description).to.equal(description_2);

      await ethers.provider.send("evm_increaseTime", [30000]);
      await v4r.connect(voter1).castVote(latestProposalId_1, 0);
      await v4r.connect(voter1).castVote(latestProposalId_2, 0);

      // Check vote details
      const voter1Receipt = await v4r
        .connect(voter1)
        .getReceipt(latestProposalId_1, voter1.address);

      const voter2Receipt = await v4r
        .connect(voter1)
        .getReceipt(latestProposalId_2, voter1.address);

      expect(voter1Receipt.hasVoted).to.be.true;
      expect(voter1Receipt.option).to.equal(0);
      expect(voter1Receipt.votes).to.be.gt(0); // Check actual votes

      expect(voter2Receipt.hasVoted).to.be.true;
      expect(voter2Receipt.option).to.equal(0);
      expect(voter2Receipt.votes).to.be.gt(0); // Check actual votes
    });

    it("Should allow voting on a 2 proposals and claim tokens", async function () {
      const amountToLock = ethers.utils.parseEther("50");

      await lockTNT20.connect(proposer1).lockTNT20(amountToLock);
      await lockTNT20Token1.connect(voter1).lockTNT20(amountToLock);
      await lockTNT20Token1.connect(proposer2).lockTNT20(amountToLock);

      expect(await lockTNT20.userLockInfo(proposer1.address)).to.equal(
        amountToLock
      );

      await helpers.mine(1000);
      await owner.sendTransaction({
        to: v4r.address,
        value: ethers.utils.parseEther("1.0"),
      });

      const description = "Sample proposal description";
      const votingOptions = ["Option A", "Option B"];

      const description_2 = "Sample proposal description and voting options";
      const votingOptions_2 = ["Option A", "Option B"];

      // Propose
      await v4r
        .connect(proposer1)
        .propose(
          rewardToken.address,
          [rewardToken.address, token_1.address, token_2.address],
          description,
          votingOptions
        );

      // Check proposal details
      const latestProposalId_1 = await v4r.latestProposalIds(proposer1.address);
      const proposal_1 = await v4r.proposals(latestProposalId_1);

      expect(proposal_1.description).to.equal(description);

      await v4r
        .connect(proposer2)
        .propose(
          rewardToken.address,
          [rewardToken.address, token_1.address],
          description_2,
          votingOptions_2
        );

      // Check proposal details
      const latestProposalId_2 = await v4r.latestProposalIds(proposer2.address);
      const proposal_2 = await v4r.proposals(latestProposalId_2);

      expect(proposal_2.description).to.equal(description_2);

      await ethers.provider.send("evm_increaseTime", [30000]);
      await v4r.connect(voter1).castVote(latestProposalId_1, 0);
      await v4r.connect(voter1).castVote(latestProposalId_2, 0);

      // Check vote details
      const voter1Receipt = await v4r
        .connect(voter1)
        .getReceipt(latestProposalId_1, voter1.address);

      const voter2Receipt = await v4r
        .connect(voter1)
        .getReceipt(latestProposalId_2, voter1.address);

      expect(voter1Receipt.hasVoted).to.be.true;
      expect(voter1Receipt.option).to.equal(0);
      expect(voter1Receipt.votes).to.be.gt(0); // Check actual votes

      expect(voter2Receipt.hasVoted).to.be.true;
      expect(voter2Receipt.option).to.equal(0);
      expect(voter2Receipt.votes).to.be.gt(0); // Check actual votes
      await expect(
        v4r.connect(voter1).castVote(latestProposalId_2, 0)
      ).to.be.revertedWith("V4R: Voter already voted");

      await ethers.provider.send("evm_increaseTime", [36050]);

      await expect(
        v4r.connect(voter1).castVote(latestProposalId_2, 0)
      ).to.be.revertedWith("V4R: Voting is closed");

      let a = await v4r.pendingUsersReward(latestProposalId_1, voter1.address);
      let b = await v4r.pendingUsersReward(latestProposalId_2, voter1.address);

      expect(a[0]).to.be.equal(proposal_1.proposalTokenRewardInfo);
      expect(a[1]).to.be.equal(proposal_1.proposaltFuelRewardInfo);

      expect(b[0]).to.be.equal(proposal_2.proposalTokenRewardInfo);
      expect(b[1]).to.be.equal(proposal_2.proposaltFuelRewardInfo);

      await v4r.connect(voter1).claimReward(latestProposalId_1);
      await v4r.connect(voter1).claimReward(latestProposalId_2);

      let c = await v4r.pendingUsersReward(latestProposalId_1, voter1.address);
      let d = await v4r.pendingUsersReward(latestProposalId_2, voter1.address);

      expect(c[0]).to.be.equal(0);
      expect(c[1]).to.be.equal(0);

      expect(d[0]).to.be.equal(0);
      expect(d[1]).to.be.equal(0);
    });
  });

  describe("V4R:TNT721", function () {
    let V4R;
    let v4r;
    let owner;
    let admin;
    let tFuelFeeWalletAddress;
    let lockTNT721;
    let tnt721ContractMock;
    let lockTNT20;

    const TOKEN_ID_1 = 1;
    const TOKEN_ID_2 = 2;
    const TOKEN_ID_3 = 3;

    const votingPeriod = 3600000;
    const proposalPeriod = 1000;
    const splitTFuelOwnersRatio = 300; // Example: 30%
    const potProposalRewardRatio = 500; // Example: 50%
    const maxOptionValue = 2; // Example: Max 5 voting options

    let rewardToken;
    const MIN_STAKE_AMOUNT = ethers.utils.parseEther("10");

    beforeEach(async function () {
      [owner, admin, tFuelFeeWalletAddress, proposer1, proposer2, voter1, voter2] =
        await ethers.getSigners();

      const MockERC20 = await ethers.getContractFactory("MockToken");
      rewardToken = await MockERC20.deploy(owner.address);
      await rewardToken.deployed();

      const MockERC20Params = await ethers.getContractFactory("MockParam");
      stakeTokenParams = await MockERC20Params.deploy();
      await stakeTokenParams.deployed();

      const TDropStakingContract = await ethers.getContractFactory(
        "TDropStaking"
      );
      TDropStaking = await TDropStakingContract.deploy(
        owner.address,
        admin.address,
        rewardToken.address,
        stakeTokenParams.address
      );
      await TDropStaking.deployed();

      const LockTNT20 = await ethers.getContractFactory("LockTNT20");
      lockTNT20 = await LockTNT20.deploy(
        owner.address,
        admin.address,
        TDropStaking.address,
        stakeTokenParams.address,
        rewardToken.address,
        MIN_STAKE_AMOUNT
      );
      await lockTNT20.deployed();

      const TNT721Mock = await ethers.getContractFactory("TNT721Mock");
      tnt721ContractMock = await TNT721Mock.deploy();
      await tnt721ContractMock.deployed();

      const LockTNT721 = await ethers.getContractFactory("LockTNT721");
      lockTNT721 = await LockTNT721.deploy(owner.address, admin.address);
      await lockTNT721.deployed();

      await lockTNT721.grantAdminRole(admin.address);

      await tnt721ContractMock.mint(proposer1.address, TOKEN_ID_1);
      await tnt721ContractMock.mint(proposer1.address, TOKEN_ID_2);
      await tnt721ContractMock.mint(proposer2.address, TOKEN_ID_3);

      // Deploying V4R contract
      V4R = await ethers.getContractFactory("V4R");
      v4r = await V4R.deploy(
        votingPeriod,
        proposalPeriod,
        splitTFuelOwnersRatio,
        potProposalRewardRatio,
        maxOptionValue,
        tFuelFeeWalletAddress.address,
        rewardToken.address,
        owner.address,
        admin.address
      );

      // Grant ADMIN_ROLE to admin
      await v4r.grantRole(await v4r.ADMIN_ROLE(), admin.address);

      await v4r.connect(admin).updateProposalCreatorList(proposer1.address, true);
      await v4r.connect(admin).updateProposalCreatorList(proposer2.address, true);
      await lockTNT20.connect(admin).setV4rAddress(v4r.address);

      // set token info
      await v4r
        .connect(admin)
        .setTokenInfo(rewardToken.address, 300, lockTNT20.address, true);

      await v4r
        .connect(admin)
        .setTokenInfo(tnt721ContractMock.address, 500, lockTNT721.address, false);
    });

    describe("Proposal Creation and Voting", function () {
      it("Should create a new proposal", async function () {
        await tnt721ContractMock.connect(proposer1).setApprovalForAll(lockTNT721.address, true);

        await lockTNT721.connect(proposer1).lockTNT721(tnt721ContractMock.address, [TOKEN_ID_1, TOKEN_ID_2]);

        const deposits = await lockTNT721.depositsOf(proposer1.address, tnt721ContractMock.address);

        const depositIds = deposits.map(id => id.toNumber());
        expect(depositIds).to.include.members([TOKEN_ID_1, TOKEN_ID_2]);

        const totalStaked = await lockTNT721.totalTNT721StakedByUser(proposer1.address);
        expect(totalStaked).to.equal(2);

        await helpers.mine(1000);

        const description = "Sample proposal description";
        const votingOptions = ["Option A", "Option B"];

        // Propose
        await v4r
          .connect(proposer1)
          .propose(rewardToken.address, [tnt721ContractMock.address], description, votingOptions);

        // Check proposal details
        const latestProposalId = await v4r.latestProposalIds(proposer1.address);
        const proposal = await v4r.proposals(latestProposalId);

        expect(proposal.description).to.equal(description);
      });
    });
  });
});
