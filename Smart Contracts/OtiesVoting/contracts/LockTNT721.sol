// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title LockTNT721
 * @dev Contract for locking TNT721 tokens with pausing and role-based access control.
 */
contract LockTNT721 is Pausable, AccessControl {
    using EnumerableSet for EnumerableSet.UintSet;

    // Address of the TNT721 contract
    address public TNT721Contract;

    // Mapping to track deposits by user and contract
    mapping(address => EnumerableSet.UintSet) private _deposits;

    // Mapping to track the total number of tokens staked by each user
    mapping(address => uint) public totalTNT721StakedByUser;

    mapping(address => uint256) public userLockTime;

    // Role identifier for admin
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Events
    event Locked(
        address indexed user,
        uint256 tokenId
    );
    event Unlocked(
        address indexed user,
        uint256 tokenId
    );
    event AdminRoleGranted(address indexed account, address indexed sender);
    event AdminRoleRevoked(address indexed account, address indexed sender);

    /**
     * @dev Constructor to initialize the contract with admin roles.
     * @param _defaultAdmin Address of the default admin
     * @param _admin Address of the admin
     */
    constructor(address _defaultAdmin, address _admin, address _tnt721) {
        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _setupRole(ADMIN_ROLE, _admin);
        TNT721Contract = _tnt721;
    }

    /**
     * @dev Function to lock TNT721 tokens into the contract.
     * @param tokenIds Array of token IDs to lock
     */
    function lockTNT721(
        uint256[] calldata tokenIds
    ) public whenNotPaused {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            IERC721(TNT721Contract).transferFrom(
                msg.sender,
                address(this),
                tokenIds[i]
            );
            _deposits[msg.sender].add(tokenIds[i]);

            emit Locked(msg.sender, tokenIds[i]);
        }
        userLockTime[msg.sender] = block.timestamp;
        totalTNT721StakedByUser[msg.sender] += tokenIds.length;
    }

    /**
     * @dev Function to unlock TNT721 tokens from the contract.
     * @param tokenIds Array of token IDs to unlock
     */
    function unlockTNT721(
        uint256[] calldata tokenIds
    ) public {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                _deposits[msg.sender].contains(tokenIds[i]),
                "LockTNT721: Token not deposited"
            );

            _deposits[msg.sender].remove(tokenIds[i]);
            IERC721(TNT721Contract).transferFrom(
                address(this),
                msg.sender,
                tokenIds[i]
            );
            emit Unlocked(msg.sender, tokenIds[i]);
        }
        totalTNT721StakedByUser[msg.sender] -= tokenIds.length;
    }

    /**
     * @dev Function to view the deposits of an account for a specific TNT721 contract.
     * @param account Address of the account
     * @return tokenIds Array of token IDs deposited by the account
     */
    function depositsOf(
        address account
    ) external view returns (uint256[] memory) {
        EnumerableSet.UintSet storage depositSet = _deposits[account];
        uint256[] memory tokenIds = new uint256[](depositSet.length());

        for (uint256 i = 0; i < depositSet.length(); i++) {
            tokenIds[i] = depositSet.at(i);
        }

        return tokenIds;
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
            return totalTNT721StakedByUser[msg.sender];
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

    /**
     * @dev Function to grant admin role to an account.
     * @param account Address to be granted the admin role
     */
    function grantAdminRole(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ADMIN_ROLE, account);
        emit AdminRoleGranted(account, msg.sender);
    }

    /**
     * @dev Function to revoke admin role from an account.
     * @param account Address to be revoked the admin role
     */
    function revokeAdminRole(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ADMIN_ROLE, account);
        emit AdminRoleRevoked(account, msg.sender);
    }

    function getUserLockTime(address userAddress) external view returns (uint) {
        return userLockTime[userAddress];
    }
}