// SPDX-License-Identifier: MIT

pragma solidity =0.8.19;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Interface/ILockTNT20Interface.sol";
import "./Interface/ILockTNT721Interface.sol";

/**
 * @title V4R Voting Contract
 * @dev This contract enables proposal creation, voting, and reward distribution for proposals using TNT20 and TNT721 tokens.
 */
contract V4R is Pausable, AccessControl {
    /// @notice The name of this contract
    string public constant name = "V4R Voting";

    // Struct to store information about voting tokens
    struct TokenInfo {
        uint votingPower;
        address lockAddress;
        bool isTNT20;
    }

    // Struct to store information about proposals
    struct Proposal {
        uint id;
        address proposer;
        uint startTime;
        uint endTime;
        uint256 proposaltFuelRewardInfo;
        uint256 proposalTokenRewardInfo;
        address[] votingTokens;
        address rewardToken;
        bool canceled;
        string description;
        string[] votingOptions;
        mapping(uint256 => uint256) votes;
        mapping(address => Receipt) receipts;
    }

    // Struct to store information about votes and rewards for a user
    struct Receipt {
        bool hasVoted;
        uint8 option;
        uint256 votes;
        uint256 claimedTokenRewardAmount;
        uint256 claimedtFuelRewardAmount;
        bool claimStatus;
    }

    // Enum to represent different states of a proposal
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        VotingEnd
    }

    // Variables to store configuration parameters for the contract
    uint public proposalPeriod; // Duration of the proposal period
    uint public splitTFuelOwnersRatio; // Ratio for splitting TFuel rewards
    uint public potProposalRewardRatio; // Ratio for proposal reward pot
    uint public maxOptionValue; // Maximum number of voting options
    uint public votingPeriod; // Duration of the voting period
    uint public proposalCount; // Count of the proposals
    uint256 public totaltFuelProposalReward; // Total reward for all proposals
    uint256 public totaltFuelClaimedReward; // Total claimed reward amount
    uint256 public lasttFuelForRewards; // Total tFuel receive for proposal
    address public tFuelFeeWalletAddress; // Address for TFuel fee wallet

    // Mappings to store various information related to proposals, tokens, and users
    mapping(address => bool) public isProposer; // Mapping to store proposer status
    mapping(address => bool) public rewardTokens; // Mapping to store reward token status
    mapping(address => TokenInfo) public tokenInfo; // Mapping to store token information
    mapping(address => bool) public isTokenWhiteListed; // Mapping to store token whitelist status
    mapping(uint => Proposal) public proposals; // Mapping to store proposals
    mapping(address => uint) public latestProposalIds; // Mapping to store latest proposal IDs for each proposer

    // Admin role for access control
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Events
    event ProposalCreated(
        uint indexed id,
        address indexed proposer,
        string description,
        string[] votingOptions,
        uint startTime,
        uint endTime,
        uint256 proposalTokenRatioAmount,
        uint256 proposaltFuelRatioAmount
    );
    event ProposalCanceled(uint indexed id);
    event ProposalExecuted(uint indexed id);
    event VoteCast(
        address indexed voter,
        uint indexed proposalId,
        uint8 option,
        uint256 votes
    );
    event RewardClaimed(
        address indexed voter,
        uint indexed proposalId,
        uint256 rewardTFel,
        uint256 rewardToken
    );
    event AdminRoleGranted(address indexed account, address indexed sender);
    event ProposalPeriodUpdated(uint newProposalPeriod);
    event VotingPeriodUpdated(uint newVotingPeriod);
    event SplitTFuelOwnersRatioUpdated(uint newSplitTFuelOwnersRatio);
    event PotProposalRewardRatioUpdated(uint newPotProposalRewardRatio);
    event MaxOptionValueUpdated(uint newMaxOptionValue);
    event TFuelFeeWalletAddressUpdated(address newTFuelFeeWalletAddress);
    event RewardTokenUpdated(address newRewardToken, bool status);
    event AdminRoleRevoked(address indexed account, address indexed sender);
    event TokenInfoUpdated(
        address indexed token,
        uint votingPower,
        address lockAddress,
        bool isTNT20
    );

    /**
     * @dev Constructor to initialize the contract with necessary parameters and admin roles.
     * @param _votingPeriod Duration of the voting period
     * @param _proposalPeriod Duration of the proposal period
     * @param _splitTFuelOwnersRatio Ratio for splitting TFuel rewards
     * @param _potProposalRewardRatio Ratio for proposal reward pot
     * @param _maxOptionValue Maximum number of voting options
     * @param _tFuelFeeWalletAddress Address for TFuel fee wallet
     * @param _rewardToken Address of the reward token
     * @param _defaultAdmin Address of the default admin
     * @param _admin Address of the admin
     */
    constructor(
        uint _votingPeriod,
        uint _proposalPeriod,
        uint _splitTFuelOwnersRatio,
        uint _potProposalRewardRatio,
        uint256 _maxOptionValue,
        address _tFuelFeeWalletAddress,
        address _rewardToken,
        address _defaultAdmin,
        address _admin
    ) {
        require(
            _tFuelFeeWalletAddress != address(0),
            "V4R: Invalid tFuel Receiver address"
        );
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(ADMIN_ROLE, _admin);

        tFuelFeeWalletAddress = _tFuelFeeWalletAddress;
        votingPeriod = _votingPeriod;
        splitTFuelOwnersRatio = _splitTFuelOwnersRatio;
        potProposalRewardRatio = _potProposalRewardRatio;
        proposalPeriod = _proposalPeriod;
        maxOptionValue = _maxOptionValue;
        rewardTokens[_rewardToken] = true;
    }

    /**
     * @dev Contract might receive/hold ETH as part of the maintenance process.
     */
    receive() external payable {}

    /**
     * @dev Function to pause the contract. Only callable by an admin.
     */
    function pause() public onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Function to unpause the contract. Only callable by an admin.
     */
    function unpause() public onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Function to update the proposal creator list. Only callable by an admin.
     * @param _creator Address of the proposal creator
     * @param _status Boolean status to set for the proposal creator
     */
    function updateProposalCreatorList(
        address _creator,
        bool _status
    ) public onlyRole(ADMIN_ROLE) {
        require(_creator != address(0), "V4R: Invalid Creator Address");
        require(isProposer[_creator] != _status, "V4R: Already in same status");
        isProposer[_creator] = _status;
    }

    /**
     * @dev Function to update the reward token list. Only callable by an admin.
     * @param _token Address of the token
     * @param _status Boolean status to set for the proposal creator
     */
    function updateRewardTokenList(
        address _token,
        bool _status
    ) public onlyRole(ADMIN_ROLE) {
        require(_token != address(0), "V4R: Invalid Token Address");
        require(rewardTokens[_token] != _status, "V4R: Already in same status");
        rewardTokens[_token] = _status;

        emit RewardTokenUpdated(_token, _status);
    }

    /**
     * @dev Function to create a new proposal.
     * @param _rewardToken Token for reward
     * @param votingTokens Array of addresses of the voting tokens
     * @param description Description of the proposal
     * @param votingOptions Array of voting options
     * @return Proposal ID
     */
    function propose(
        address _rewardToken,
        address[] memory votingTokens,
        string memory description,
        string[] memory votingOptions
    ) public whenNotPaused returns (uint) {
        require(
            isProposer[msg.sender] == true && rewardTokens[_rewardToken],
            "V4R: Not allowed to create proposal"
        );
        require(
            bytes(description).length > 0 &&
                (votingOptions.length > 0 &&
                    votingOptions.length <= maxOptionValue),
            "V4R: Invalid Description or votingOptions"
        );
        for (uint256 j = 0; j < votingTokens.length; j++) {
            require(
                (votingTokens.length > 0) &&
                    tokenInfo[votingTokens[j]].lockAddress != address(0) &&
                    (isTokenWhiteListed[votingTokens[j]]),
                "V4R: Invalid Voting Token Addresses"
            );
        }

        uint latestProposalId = latestProposalIds[msg.sender];
        if (latestProposalId != 0) {
            ProposalState proposersLatestProposalState = state(
                latestProposalId
            );
            require(
                (proposersLatestProposalState != ProposalState.Active &&
                    proposersLatestProposalState != ProposalState.Pending),
                "V4R: One live proposal per proposer, found an already active proposal"
            );
        }
        (
            uint256 proposaltFuelRatioAmount,
            uint256 ownertFuelRatioAmount
        ) = claimTFuelReward();
        uint256 proposalTokenRatioAmount = claimTokenReward(
            tokenInfo[_rewardToken].lockAddress,
            _rewardToken
        );

        payable(tFuelFeeWalletAddress).transfer(ownertFuelRatioAmount);

        uint startTime = proposalPeriod + block.timestamp;
        uint endTime = startTime + votingPeriod;

        proposalCount++;

        Proposal storage newProposal = proposals[proposalCount];

        newProposal.id = proposalCount;
        newProposal.proposer = msg.sender;
        newProposal.startTime = startTime;
        newProposal.endTime = endTime;
        newProposal.canceled = false;
        newProposal.description = description;
        newProposal.votingOptions = votingOptions;
        newProposal.votingTokens = votingTokens;
        newProposal.rewardToken = _rewardToken;

        for (uint256 i = 0; i < votingOptions.length; i++) {
            require(
                bytes(votingOptions[i]).length > 0,
                "V4R: Option cannot be empty"
            );
            newProposal.votes[i] = 0;
        }

        latestProposalIds[newProposal.proposer] = newProposal.id;
        newProposal.proposalTokenRewardInfo = proposalTokenRatioAmount;
        newProposal.proposaltFuelRewardInfo = proposaltFuelRatioAmount;
        totaltFuelProposalReward =
            totaltFuelProposalReward +
            proposaltFuelRatioAmount;

        emit ProposalCreated(
            newProposal.id,
            newProposal.proposer,
            description,
            votingOptions,
            startTime,
            endTime,
            proposalTokenRatioAmount,
            proposaltFuelRatioAmount
        );

        return newProposal.id;
    }

    /**
     * @notice Retrieves the voting options for a specific proposal.
     * @dev This function fetches the array of voting options associated with the given proposal ID.
     * @param proposalId The ID of the proposal for which to get the voting options.
     * @return An array of strings representing the voting options for the specified proposal.
     */
    function getProposalVotingOptions(
        uint proposalId
    ) public view returns (string[] memory) {
        require(
            proposalId <= proposalCount,
            "V4R: Proposal id must be greater than current proposal count"
        );
        return proposals[proposalId].votingOptions;
    }

    /**
     * @notice Retrieves the number of votes for a specific proposal and index.
     * @dev This function fetches the vote count from the proposal's vote array.
     * @param proposalId The ID of the proposal for which to get the vote count.
     * @param _index The index in the votes array to retrieve the vote count from.
     * @return The number of votes at the specified index for the given proposal.
     */
    function getProposalVotingCounts(
        uint proposalId,
        uint _index
    ) public view returns (uint256) {
        require(
            proposalId <= proposalCount,
            "V4R: Proposal id must be greater than current proposal count"
        );
        return proposals[proposalId].votes[_index];
    }

    function claimTFuelReward() internal returns (uint256, uint256) {
        uint256 tFuelBal = address(this).balance;
        uint256 totalFinaltFuleReward = tFuelBal -
            (totaltFuelProposalReward - totaltFuelClaimedReward);

        uint256 ownerRatioAmount = ((totalFinaltFuleReward -
            lasttFuelForRewards) * splitTFuelOwnersRatio) / 1000;

        uint256 leftTFuel = totalFinaltFuleReward - ownerRatioAmount;
        uint256 proposalRatioAmount = (leftTFuel * potProposalRewardRatio) /
            1000;

        lasttFuelForRewards =
            tFuelBal -
            (proposalRatioAmount + ownerRatioAmount);
        return (proposalRatioAmount, ownerRatioAmount);
    }

    function claimTokenReward(
        address lockAddress,
        address token
    ) internal returns (uint256) {
        uint256 rewardAmount = ILockTNT20Interface(lockAddress).rewardAmount();

        uint256 proposalRatioAmount = (rewardAmount * potProposalRewardRatio) /
            1000;

        uint256 tokenBefore = IERC20(token).balanceOf(address(this));
        ILockTNT20Interface(lockAddress).claimPendingReward(
            proposalRatioAmount
        );
        uint256 tokenAfter = IERC20(token).balanceOf(address(this));
        return (tokenAfter - tokenBefore);
    }

    /**
     * @dev Function to get the receipt of a voter for a proposal.
     * @param proposalId ID of the proposal
     * @param voter Address of the voter
     * @return Receipt of the voter
     */
    function getReceipt(
        uint proposalId,
        address voter
    ) external view returns (Receipt memory) {
        return proposals[proposalId].receipts[voter];
    }

    /**
     * @dev Function to get the state of a proposal.
     * @param proposalId ID of the proposal
     * @return State of the proposal
     */
    function state(uint proposalId) public view returns (ProposalState) {
        require(proposalCount >= proposalId, "V4R: Invalid proposal id");
        Proposal storage proposal = proposals[proposalId];
        if (proposal.canceled) {
            return ProposalState.Canceled;
        } else if (block.timestamp <= proposal.startTime) {
            return ProposalState.Pending;
        } else if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        } else {
            return ProposalState.VotingEnd;
        }
    }

    /**
     * @dev Function to cast a vote for a proposal.
     * @param proposalId ID of the proposal
     * @param support Voting option to support
     */
    function castVote(uint proposalId, uint8 support) external whenNotPaused {
        castVoteInternal(msg.sender, proposalId, support);
    }

    function castVoteInternal(
        address voter,
        uint proposalId,
        uint8 option
    ) internal returns (uint256) {
        require(
            state(proposalId) == ProposalState.Active,
            "V4R: Voting is closed"
        );
        Proposal storage proposal = proposals[proposalId];

        require(
            option < proposal.votingOptions.length,
            "V4R: Invalid vote option"
        );
        Receipt storage receipt = proposal.receipts[voter];
        require(receipt.hasVoted == false, "V4R: Voter already voted");

        uint256 votes = 0;
        uint256 totalVotes = 0;

        for (uint i = 0; i < proposal.votingTokens.length; i++) {
            TokenInfo storage _tokenInfo = tokenInfo[proposal.votingTokens[i]];

            votes = ILockTNT20Interface(_tokenInfo.lockAddress).getUserVotes(
                voter,
                proposal.startTime
            );
            totalVotes = totalVotes + ((votes * _tokenInfo.votingPower) / 1000);
        }

        proposal.votes[option] = proposal.votes[option] + totalVotes;

        receipt.hasVoted = true;
        receipt.option = option;
        receipt.votes = totalVotes;

        emit VoteCast(voter, proposalId, option, votes);

        return votes;
    }

    /**
     * @dev Function to get the pending reward for a user.
     * @param _pid ID of the proposal
     * @return Pending reward amount
     */
    function pendingUsersReward(
        uint _pid,
        address _user
    ) public view returns (uint256, uint256) {
        require(proposalCount >= _pid, "V4R: Invalid proposal id");
        ProposalState proposersLatestProposalState = state(_pid);
        require(
            (proposersLatestProposalState != ProposalState.Active &&
                proposersLatestProposalState != ProposalState.Pending),
            "V4R: Found an already active proposal"
        );
        Proposal storage proposal = proposals[_pid];
        Receipt storage receipt = proposal.receipts[_user];

        if (receipt.claimStatus == true) {
            return (0, 0);
        }

        uint256 totalVotes = 0;
        for (uint256 i = 0; i < proposal.votingOptions.length; i++) {
            totalVotes = totalVotes + proposal.votes[i];
        }
        uint votingShare = (receipt.votes * 10 ** 12) / totalVotes;
        uint256 pendingTokenReward = (proposal.proposalTokenRewardInfo *
            votingShare) / 10 ** 12;
        uint256 pendingtFuelReward = (proposal.proposaltFuelRewardInfo *
            votingShare) / 10 ** 12;
        return (pendingTokenReward, pendingtFuelReward);
    }

    /**
     * @dev Function to claim the reward for a proposal.
     * @param _pid ID of the proposal
     */
    function claimReward(uint _pid) public whenNotPaused {
        require(proposalCount >= _pid, "V4R: Invalid proposal id");
        ProposalState proposersLatestProposalState = state(_pid);
        require(
            (proposersLatestProposalState != ProposalState.Active &&
                proposersLatestProposalState != ProposalState.Pending),
            "V4R: Found an already active proposal"
        );
        Proposal storage proposal = proposals[_pid];
        Receipt storage receipt = proposal.receipts[msg.sender];

        require(receipt.claimStatus != true, "V4R: Already Claimed");
        uint256 totalVotes = 0;
        for (uint256 i = 0; i < proposal.votingOptions.length; i++) {
            totalVotes = totalVotes + proposal.votes[i];
        }
        uint votingShare = (receipt.votes * 10 ** 12) / totalVotes;

        uint256 pendingTokenReward = (proposal.proposalTokenRewardInfo *
            votingShare) / 10 ** 12;
        uint256 pendingtFuelReward = (proposal.proposaltFuelRewardInfo *
            votingShare) / 10 ** 12;
        IERC20(proposal.rewardToken).transfer(msg.sender, pendingTokenReward);
        payable(msg.sender).transfer(pendingtFuelReward);

        receipt.claimStatus = true;
        receipt.claimedTokenRewardAmount = pendingTokenReward;
        receipt.claimedtFuelRewardAmount = pendingtFuelReward;
        totaltFuelClaimedReward = totaltFuelClaimedReward + pendingtFuelReward;

        emit RewardClaimed(
            msg.sender,
            _pid,
            pendingtFuelReward,
            pendingTokenReward
        );
    }

    /**
     * @dev Function to update the proposal period. Only callable by an admin.
     * @param _proposalPeriod New proposal period
     */
    function setProposalPeriod(
        uint _proposalPeriod
    ) public onlyRole(ADMIN_ROLE) {
        require(_proposalPeriod > 0, "V4R: Invalid proposal period");
        proposalPeriod = _proposalPeriod;

        emit ProposalPeriodUpdated(_proposalPeriod);
    }

    /**
     * @notice Setter method to update the voting period.
     * @dev Only callable by admins with the ADMIN_ROLE.
     * @param newVotingPeriod The new voting period duration in seconds.
     */
    function setVotingPeriod(
        uint newVotingPeriod
    ) external onlyRole(ADMIN_ROLE) {
        require(newVotingPeriod > 0, "V4R: Invalid voting period");

        votingPeriod = newVotingPeriod;

        emit VotingPeriodUpdated(newVotingPeriod);
    }

    /**
     * @dev Function to update the TFuel owners ratio. Only callable by an admin.
     * @param _splitTFuelOwnersRatio New TFuel owners ratio
     */
    function setSplitTFuelOwnersRatio(
        uint _splitTFuelOwnersRatio
    ) public onlyRole(ADMIN_ROLE) {
        require(_splitTFuelOwnersRatio > 0, "V4R: Invalid TFuel owners ratio");
        splitTFuelOwnersRatio = _splitTFuelOwnersRatio;

        emit SplitTFuelOwnersRatioUpdated(_splitTFuelOwnersRatio);
    }

    /**
     * @dev Function to update the pot proposal reward ratio. Only callable by an admin.
     * @param _potProposalRewardRatio New pot proposal reward ratio
     */
    function setPotProposalRewardRatio(
        uint _potProposalRewardRatio
    ) public onlyRole(ADMIN_ROLE) {
        require(
            _potProposalRewardRatio > 0,
            "V4R: Invalid pot proposal reward ratio"
        );
        potProposalRewardRatio = _potProposalRewardRatio;

        emit PotProposalRewardRatioUpdated(_potProposalRewardRatio);
    }

    /**
     * @dev Function to update the maximum number of voting options. Only callable by an admin.
     * @param _maxOptionValue New maximum number of voting options
     */
    function setMaxOptionValue(
        uint _maxOptionValue
    ) public onlyRole(ADMIN_ROLE) {
        require(_maxOptionValue > 0, "V4R: Invalid max option value");
        maxOptionValue = _maxOptionValue;

        emit MaxOptionValueUpdated(_maxOptionValue);
    }

    /**
     * @dev Function to update the TFuel fee wallet address. Only callable by an admin.
     * @param _tFuelFeeWalletAddress New TFuel fee wallet address
     */
    function setTFuelFeeWalletAddress(
        address _tFuelFeeWalletAddress
    ) public onlyRole(ADMIN_ROLE) {
        require(
            _tFuelFeeWalletAddress != address(0),
            "V4R: Invalid TFuel fee wallet address"
        );
        tFuelFeeWalletAddress = _tFuelFeeWalletAddress;

        emit TFuelFeeWalletAddressUpdated(_tFuelFeeWalletAddress);
    }

    /**
     * @notice Setter method to update voting power and lock address for a token.
     * @dev Only callable by admins with the ADMIN_ROLE.
     * @param token The token address to update.
     * @param votingPower The new voting power for the token.
     * @param lockAddress The new lock address associated with the token.
     * @param isTNT20 Boolean indicating if the token is of type TNT20.
     */
    function setTokenInfo(
        address token,
        uint votingPower,
        address lockAddress,
        bool isTNT20
    ) external onlyRole(ADMIN_ROLE) {
        require(token != address(0), "V4R: Invalid Token address");
        require(
            lockAddress != address(0),
            "V4R: Invalid Lock Contract address"
        );

        tokenInfo[token].votingPower = votingPower;
        tokenInfo[token].lockAddress = lockAddress;
        tokenInfo[token].isTNT20 = isTNT20;
        isTokenWhiteListed[token] = true;

        emit TokenInfoUpdated(token, votingPower, lockAddress, isTNT20);
    }
}
