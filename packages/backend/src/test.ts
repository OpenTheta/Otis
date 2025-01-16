import { ethers } from 'ethers';
import ContractScanner from './cryptoData/ContractScanner.js';
import ThetaProvider from './cryptoData/ThetaProvider.js';
import v4Contract from './cryptoData/contracts/contractV4R.js';
import ContractLockOties from "./cryptoData/contracts/contractLockOties.js";
import ContractLockTDrop from "./cryptoData/contracts/contractLockTDrop.js";
import server from "./server/server.js";

const providerUrl = 'https://eth-rpc-api-testnet.thetatoken.org/rpc' //'https://eth-rpc-api.thetatoken.org/rpc';
const providerUrlTheta = 'https://theta-bridge-rpc-testnet.thetatoken.org/rpc' //'https://theta-bridge-rpc.thetatoken.org/rpc';

const thetaProvider = new ThetaProvider([providerUrl],[providerUrlTheta,providerUrlTheta]);

const contractList = [
    v4Contract,
    ContractLockOties,
    ContractLockTDrop,
];

// Todo collect transaction hashes so at restart there are no transaction updated twice

// Lock TNT721 28895873
// Lock TNT20 28896063
// Unlock TNT20 28898229
// Unlock TNT721 28898250
// Add Proposer 28898339, 28898406, 28908427
// Remove Proposer 28898354
// Token Add TNT20 28898465
// Token Add TNT721 28898552 -> Todo: Error Voting Power out of range
// Token Add TNT721 28898577
// Add Reward Token List 28898605, 28898638, 28908575
// Remove Reward Token List 28898625
// Set Max Option Value 28898656
// Set Pot Proposal Reward Ratio 28907995
// Set TFuel Owner split 28908015
// Set Max Voting Period 28908035, 28908054
// Set Min Voting Period 28908065, 	28908774
// Set Max Proposal Period 28908084
// Set Min Proposal Period 28908091, 28908755
// Create Proposal 28908787
// Vote 28909782
// Claim Rewards 28912179


// lock Otie 28908508
// Set token info (TDrop) 28934155
// set token info (Oties) 28934168
// set Reward token (TDrop) 28934178
// Set proposer 28934514
// lock TDrop 28934561
// create Proposal 28934577
// cancel Propoasal 28934606

const main = async () => {
    const scanner = new ContractScanner(thetaProvider)
    await scanner.setup(contractList)
    // await scanner.scanBlock(28908508)
    // await scanner.scanBlock(28934155)
    // await scanner.scanBlock(28934168)
    // await scanner.scanBlock(28934178)
    // await scanner.scanBlock(28934514)
    // await scanner.scanBlock(28934561)
    // await scanner.scanBlock(28934577)
    // await scanner.scanBlock(28934606)
    // await scanner.scanBlock(29008369)
    // await scanner.scanBlock(29067009)
    await server();
}

main()


// thetaProvider.getBlockWithContractTransactions(26099684).then((block) => {
//     console.log('block', block);
//     for (let tx of block.transactions) {
//         console.log('tx', tx);
//         // const contract = ContractScanner.getContractFromData(tx.data, defaultContract);
//         // console.log('contract', contract);
//     }
// }).catch((error) => {
//     console.error('error', error);
// })