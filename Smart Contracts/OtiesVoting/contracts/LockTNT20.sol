// SPDX-License-Identifier: MIT

pragma solidity =0.8.19;

import "@openzeppelin/contracts@4.8.2/access/AccessControl.sol";
import "@openzeppelin/contracts@4.8.2/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts@4.8.2/security/Pausable.sol";
import "./Interface/IStake.sol";

/**
 * @title LockTNT20
 * @dev A contract for locking TNT20 tokens into a staking contract with pausing and role-based access control.
 */
contract LockTNT20 is Pausable, AccessControl {
    // Address of the staking contract
    address public stakeContract;
    // Address of the staking contract
    address public stakeParam;

    // Address of the staking token
    address public stakeToken;

    // Address authorized to claim rewards
    address public v4rAddress;

    // Minimum amount required to stake
    uint256 public minStakeAmount;

    // Total amount of tokens locked in the contract
    uint256 public totalLockAmount;

    // Mapping to track user locked amounts
    mapping(address => uint256) public userLockInfo;

    mapping(address => uint256) public userLockTime;

    // Role identifier for admin
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Events
    event Locked(address indexed user, uint256 amount);
    event Unlocked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed caller, uint256 amount);
    event StakeContractUpdated(address indexed admin, address newStakeContract);
    event StakeTokenUpdated(address indexed admin, address newStakeToken);
    event MinStakeAmountUpdated(
        address indexed admin,
        uint256 newMinStakeAmount
    );
    event V4rAddressUpdated(address indexed admin, address newV4rAddress);

    /**
     * @dev Constructor to initialize the contract with required parameters.
     * @param _defaultAdmin Address of the default admin
     * @param _admin Address of the admin
     * @param _stakeContract Address of the staking contract
     * @param _stakeToken Address of the staking token contract
     * @param _minStakeAmount Minimum amount required to stake
     */
    constructor(
        address _defaultAdmin,
        address _admin,
        address _stakeContract,
        address _stakeParam,
        address _stakeToken,
        uint256 _minStakeAmount
    ) {
        require(
            _stakeContract != address(0),
            "LockTNT20: Invalid Stake Contract"
        );
        require(
            _stakeToken != address(0),
            "LockTNT20: Invalid Stake Token Contract"
        );
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(ADMIN_ROLE, _admin);

        stakeContract = _stakeContract;
        stakeToken = _stakeToken;
        minStakeAmount = _minStakeAmount;
        stakeParam = _stakeParam;
    }

    /**
     * @dev Function to lock tokens into the staking contract.
     * @param _amount Amount of tokens to lock
     */
    function lockTNT20(uint256 _amount) public whenNotPaused {
        require(
            minStakeAmount <= _amount,
            "LockTNT20: Lock Amount less than min amount"
        );

        IERC20(stakeToken).transferFrom(msg.sender, address(this), _amount);
        IERC20(stakeToken).approve(stakeContract, _amount);
        IStake(stakeContract).stake(_amount);

        totalLockAmount += _amount;
        userLockInfo[msg.sender] += _amount;
        userLockTime[msg.sender] = block.timestamp;

        emit Locked(msg.sender, _amount);
    }

    /**
     * @dev Function to unlock tokens from the staking contract.
     * @param _amount Amount of tokens to unlock
     */
    function unlockTNT20(uint256 _amount) public {
        uint256 userStakeAmount = userLockInfo[msg.sender];
        require(
            userStakeAmount >= _amount,
            "LockTNT20: Invalid unStake amount"
        );

        _unstakeRawAmount(_amount);
        uint256 tokenBal = IERC20(stakeToken).balanceOf(address(this));
        IERC20(stakeToken).transfer(msg.sender, tokenBal);

        totalLockAmount -= tokenBal;
        userLockInfo[msg.sender] -= tokenBal;

        emit Unlocked(msg.sender, tokenBal);
    }

    /**
     * @dev Function to add tokens to the staking contract. User is not able to claim them again
     * @param _amount Amount of tokens to be added to the staking
     */
    function addTNT20(uint256 _amount) external {
        IERC20(stakeToken).transferFrom(msg.sender, address(this), _amount);
        IERC20(stakeToken).approve(stakeContract, _amount);
        IStake(stakeContract).stake(_amount);
    }

    /**
     * @dev Function to claim pending rewards. Only callable by the authorized address
     */
    function claimPendingReward(uint rawAmount) public {
        require(msg.sender == v4rAddress, "LockTNT20: Invalid Sender Address");
        require(rawAmount <= rewardAmount(), "LockTNT20: Invalid Reward Amount");
        _unstakeRawAmount(rawAmount);
        uint256 rewardBal = IERC20(stakeToken).balanceOf(address(this));
        IERC20(stakeToken).transfer(v4rAddress, rewardBal);
        emit RewardClaimed(msg.sender, rewardBal);
    }

    // TODO: check if this really unstakes exact rawAmount
    function _unstakeRawAmount(uint256 rawAmount) internal {
        uint256 currentHeight = block.number;

        uint256 _lastRewardMintHeight = IStake(stakeContract)
            .lastRewardMintHeight();
        uint256 _rewardPerBlock = IStake(stakeParam).stakingRewardPerBlock();

        uint256 amount = (_rewardPerBlock *
            (currentHeight - _lastRewardMintHeight));
        uint256 balanceOfTDropStake = IERC20(stakeToken).balanceOf(
            stakeContract
        );

        uint256 prevBalance = balanceOfTDropStake + amount;
        uint256 totalShares = IStake(stakeContract).totalShares();
        uint256 userShares = (totalShares * rawAmount) / prevBalance;

        IStake(stakeContract).unstake(userShares);
    }

    /**
     * @notice Retrieves the user vote power.
     * @param _user The address of the user whose lock time is being queried.
     * @param _pTime The proposal time
     * @return The voting power.
     */
    function getUserVotes(
        address _user,
        uint256 _pTime
    ) public view returns (uint256) {
        if (userLockTime[_user] > _pTime) {
            return 0;
        } else {
            return userLockInfo[_user] / 1 ether;
        }
    }

    /**
     * @notice Calculates and returns the total reward amount available.
     * @dev This function computes the reward by subtracting the total locked amount from the total estimated TDrop owned by this contract.
     * @return The amount of reward tokens available. Returns 0 if the total locked amount is 0.
     */
    function rewardAmount() public view returns (uint) {
        if (totalLockAmount == 0) {
            return 0;
        }
        uint256 totalRewardAndStake = IStake(stakeContract)
            .estimatedTDropOwnedBy(address(this));
        uint256 rewardTokens = totalRewardAndStake - totalLockAmount;
        return rewardTokens;
    }

    /**
     * @dev Function to update the staking contract address. Only callable by an admin.
     * @param _stakeContract New staking contract address
     */
    function setStakeContract(
        address _stakeContract
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _stakeContract != address(0),
            "LockTNT20: Invalid Stake Contract"
        );
        stakeContract = _stakeContract;

        emit StakeContractUpdated(msg.sender, _stakeContract);
    }

    /**
     * @dev Function to update the staking token contract address. Only callable by an admin.
     * @param _stakeToken New staking token contract address
     */
    function setStakeToken(address _stakeToken) external onlyRole(ADMIN_ROLE) {
        require(
            _stakeToken != address(0),
            "LockTNT20: Invalid Stake Token Contract"
        );
        stakeToken = _stakeToken;

        emit StakeTokenUpdated(msg.sender, _stakeToken);
    }

    /**
     * @dev Function to update the minimum stake amount. Only callable by an admin.
     * @param _minStakeAmount New minimum stake amount
     */
    function setMinStakeAmount(
        uint256 _minStakeAmount
    ) external onlyRole(ADMIN_ROLE) {
        minStakeAmount = _minStakeAmount;

        emit MinStakeAmountUpdated(msg.sender, _minStakeAmount);
    }

    /**
     * @dev Function to update the authorized address for claiming rewards. Only callable by an admin.
     * @param _v4rAddress New authorized address
     */
    function setV4rAddress(address _v4rAddress) external onlyRole(ADMIN_ROLE) {
        require(_v4rAddress != address(0), "LockTNT20: Invalid v4r Address");
        v4rAddress = _v4rAddress;

        emit V4rAddressUpdated(msg.sender, _v4rAddress);
    }

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
     * @notice Retrieves the lock time for a specific user.
     * @param userAddress The address of the user whose lock time is being queried.
     * @return The lock time of the user in seconds.
     */
    function getUserLockTime(address userAddress) external view returns (uint) {
        return userLockTime[userAddress];
    }

    /**
     * @notice Retrieves the locked Token amount for a specific user.
     * @param userAddress The address of the user whose lock time is being queried.
     * @return The lock time of the user in seconds.
     */
    function getUserLockedTokenAmount(address userAddress) external view returns (uint) {
        return userLockInfo[userAddress];
    }
}
