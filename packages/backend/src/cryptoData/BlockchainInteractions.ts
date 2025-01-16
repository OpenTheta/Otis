// Code to interact with the blockchain
import { ethers } from "ethers";
import ThetaProvider from "./ThetaProvider.js";
import contractV4R from "./contracts/contractV4R.js";

// Define the ABI for the `proposals` function
const ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "proposals",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "proposer",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "startTime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "endTime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "proposaltFuelRewardInfo",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "proposalTokenRewardInfo",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "rewardToken",
                "type": "address"
            },
            {
                "internalType": "bool",
                "name": "canceled",
                "type": "bool"
            },
            {
                "internalType": "string",
                "name": "description",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "proposalId",
                "type": "uint256"
            }
        ],
        "name": "getProposalVotingTokens",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
];

// Define the contract address (replace with the actual address)
const CONTRACT_ADDRESS = contractV4R.address;

// Create a contract instance

// Function to get additional proposal data from the blockchain
export async function getProposalData(proposalId: number, thetaProvider: ethers.FallbackProvider) {
    try {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, thetaProvider.provider);

        const [proposal, votingTokens] = await Promise.all([
            contract.proposals(proposalId),
            contract.getProposalVotingTokens(proposalId)
        ]);

        // Parse and format the response
        return {
            id: Number(proposal.id),
            proposer: proposal.proposer,
            startTime: new Date(Number(proposal.startTime) * 1000), // Convert Unix timestamp to JavaScript Date
            endTime: new Date(Number(proposal.endTime) * 1000),
            proposaltFuelRewardInfo: proposal.proposaltFuelRewardInfo.toString(),
            proposalTokenRewardInfo: proposal.proposalTokenRewardInfo.toString(),
            rewardToken: proposal.rewardToken,
            canceled: proposal.canceled,
            description: proposal.description,
            votingTokens: votingTokens
        };
    } catch (error) {
        console.error("Error fetching proposal data:", error);
        throw new Error("Failed to fetch proposal data from the blockchain.");
    }
}

