// SPDX-License-Identifier: MIT

pragma solidity =0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../Interface/IStake.sol";

// import "hardhat/console.sol";

/**
 * @title MockLockTNT20
 * @dev A contract for locking TNT20 tokens into a staking contract with pausing and role-based access control.
 */
contract MockLockTNT20 is Pausable, AccessControl {
    // Address authorized to claim rewards
    address public v4rAddress;

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
     */
    constructor(address _defaultAdmin, address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _grantRole(ADMIN_ROLE, _admin);
    }

    /**
     * @dev Function to lock tokens into the staking contract.
     * @param _amount Amount of tokens to lock
     */
    function lockTNT20(uint256 _amount) public whenNotPaused {
        totalLockAmount += _amount;
        userLockInfo[msg.sender] += _amount;

        emit Locked(msg.sender, _amount);
    }

    /**
     * @dev Function to unlock tokens from the staking contract.
     * @param _amount Amount of tokens to unlock
     */
    function unlockTNT20(uint256 _amount) public whenNotPaused {
        uint256 userStakeAmount = userLockInfo[msg.sender];
        require(
            userStakeAmount >= _amount,
            "LockTNT20: Invalid unStake amount"
        );

        totalLockAmount -= _amount;
        userLockInfo[msg.sender] -= _amount;
        userLockTime[msg.sender] = block.timestamp;

        emit Unlocked(msg.sender, _amount);
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

    function getUserVotes(
        address _user,
        uint256 _pTime
    ) public view returns (uint256) {
        if (userLockTime[_user] > _pTime) {
            return 0;
        } else {
            return userLockInfo[_user];
        }
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

    function getUserLockTime(address userAddress) external view returns (uint) {
        return userLockTime[userAddress];
    }
}
