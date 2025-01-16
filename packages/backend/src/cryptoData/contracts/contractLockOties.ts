import { ethers } from 'ethers';
import ContractDefinition, { EventType } from '../handler/ContractDefinition.js';

const TOKEN_ADDRESS = '0x5f98156b5f6401e7fd899e9fa2d60b07233d25b6';
const contractLockOties: ContractDefinition = {
    name: 'LockOties',
    address: '0xca28463bed2076be12358222cb1692b5d69f23e3',
    events: [
        {
            inputs: [
                { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
            ],
            name: 'Locked',
            handler: (event) => ({
                event: EventType.lockTNT721,
                tokenAddress: TOKEN_ADDRESS,
                userAddress: event.user,
                tokenId: event.tokenId,
            }),
        },
        {
            inputs: [
                { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
            ],
            name: 'Unlocked',
            handler: (event) => ({
                event: EventType.unlockTNT721,
                tokenAddress: TOKEN_ADDRESS,
                userAddress: event.user,
                tokenId: event.tokenId,
            }),
        },
    ]
};

export default contractLockOties;

