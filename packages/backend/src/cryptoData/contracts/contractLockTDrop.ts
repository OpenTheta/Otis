import { ethers } from 'ethers';
import ContractDefinition, { EventType } from '../handler/ContractDefinition.js';

const TOKEN_ADDRESS = '0x11cac290c3a12744dc7cb647e7b6032303c64152';
const contractLockTDrop: ContractDefinition = {
    name: 'LockTDrop',
    address: '0x44f4070857060fdf7fc2e63816667d4e5f88371e',
    events: [
        {
            inputs: [
                { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
            ],
            name: 'Locked',
            handler: (event) => ({
                event: EventType.lockTNT20,
                tokenAddress: TOKEN_ADDRESS,
                userAddress: event.user,
                tokenAmount: event.amount,
            }),
        },
        {
            inputs: [
                { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
                { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
            ],
            name: 'Unlocked',
            handler: (event) => ({
                event: EventType.unlockTNT20,
                tokenAddress: TOKEN_ADDRESS,
                userAddress: event.user,
                tokenAmount: event.amount,
            }),
        },
    ]
};

export default contractLockTDrop;
