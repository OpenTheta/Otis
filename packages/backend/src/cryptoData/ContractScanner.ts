import { ethers } from 'ethers';
import ContractDefinition, {EventType, LockTNT20Events, LogEvent} from './handler/ContractDefinition.js';
import ThetaProvider, {ThetaBlock, ThetaLog, ThetaTransaction} from './ThetaProvider.js';
import SmartContract from "./handler/SmartContract.js";
import DbAddress from "../database/api/DbAddress.js";
import DbTokens from "../database/api/DbTokens.js";
import DbProposal from "../database/api/DbProposal.js";
import DbConfig from "../database/api/DbConfig.js";
import DbTransactions from "../database/api/DbTransactions.js";
import DbVote from "../database/api/DbVote.js";
import DbProposer from "../database/api/DbProposer.js";

// import db from '../database/db';

class ContractScanner {
    private provider: ThetaProvider;
    private contracts: SmartContract[] = [];
    private contractsByAddress: { [adr: string]: SmartContract } = {};

    constructor(provider: ThetaProvider) {
        this.provider = provider
    }

    public async setup(contractList: ContractDefinition[]) {
        // Setup contracts and other initializations
        await this.setupInternal(contractList);
    }

    private async setupInternal(contractList: ContractDefinition[]) {
        for (const def of contractList) {
            if (def.address.toLowerCase() !== def.address) {
                throw new Error(`Make sure, contract.address is lowercase! Not the case for: ${def.name}`);
            }
            // const addressID = await DbContract.addressID(def.address); // add contract to database (in case it's not already there)
            const contract = new SmartContract(def);
            this.contractsByAddress[contract.address] = contract;
            await DbAddress.ID(def.address);
            console.log("Contract", contract.address)
            this.contracts.push(contract);
            console.log(this.contracts)
        }
    }

    private async handleLogEvent(logEvent: LogEvent, log: ThetaLog, block: ThetaBlock, transactionID: number) {

    }

    public async scanBlock(blockNumber: number): Promise<void> {
        console.log("Scan Block start")
        const block = await this.provider.getBlockWithContractTransactions(blockNumber);
        console.log(block)
        if (!block) {
            console.error(`Block ${blockNumber} not found`);
            return;
        }
        // const transactions = await Promise.all(block.transactions.map(txHash => this.provider.getTransaction(txHash)));
        const transactions = block.transactions

        for (const tx of transactions) {
            for (const log of tx.logs) {
                const contract = this.contractsByAddress[log.address.toLowerCase()];
                if (!contract) {
                    continue;
                }
                const event = contract.logToEvent(log, tx);
                if (event) {
                    // add hash to db
                    const txID = await DbTransactions.ID(block.blockHeight, tx.hash, block.timestamp);
                    // Todo add txID to Config table -> only update if txID.blockheight > config.blockheight DONE
                    // Todo add txID to votes, tnt20_deposits and tnt721_deposits functions DONE
                    switch (event.event) {
                        case EventType.lockTNT20: await DbTokens.lockTNT20Token(contract.address, event.tokenAddress, event.userAddress, Number(ethers.formatUnits(event.tokenAmount, 18)), txID); break; // checked
                        case EventType.lockTNT721: await DbTokens.lockTNT721Token(contract.address, event.tokenAddress, event.userAddress, Number(ethers.formatUnits(event.tokenId, 0)), txID); break; // checked
                        case EventType.unlockTNT20: await DbTokens.unlockTNT20Token(contract.address, event.tokenAddress, event.userAddress, Number(ethers.formatUnits(event.tokenAmount, 18))); break; // checked
                        case EventType.unlockTNT721: await DbTokens.unlockTNT721Token(contract.address, event.tokenAddress, event.userAddress, Number(ethers.formatUnits(event.tokenId, 0))); break; // checked
                        case EventType.proposer_role_updated: await DbProposer.updateProposer(event.proposerAddress, event.isProposer); break; // checked
                        case EventType.token_info_updated: await DbTokens.updateTokenInfo(event.tokenAddress, Number(ethers.formatUnits(event.votingPower, 0)), event.lockAddress, event.isTNT20); break; // checked
                        case EventType.reward_token_updated: await DbTokens.updateRewardToken(event.rewardToken, event.isRewardToken); break; // checked
                        case EventType.max_option_value_updated: await DbConfig.setConfig('MaxOptionValue', Number(ethers.formatUnits(event.maxOptionValue, 0)), txID); break; // checked
                        case EventType.pot_proposal_reward_ratio_update: await DbConfig.setConfig('PotProposalRewardRatio', Number(ethers.formatUnits(event.potProposalRewardRatio,0)), txID); break; // checked
                        case EventType.split_tfuel_owners_ratio_update: await DbConfig.setConfig('SplitTFuelOwnersRatio', Number(ethers.formatUnits(event.splitTFuelOwnersRatio,0)), txID); break; // checked
                        case EventType.max_voting_period_update: await DbConfig.setConfig('MaxVotingPeriod', Number(ethers.formatUnits(event.maxVotingPeriod,0)), txID); break; // checked
                        case EventType.min_voting_period_update: await DbConfig.setConfig('MinVotingPeriod', Number(ethers.formatUnits(event.minVotingPeriod,0)), txID); break; // checked
                        case EventType.max_proposal_period_update: await DbConfig.setConfig('MaxProposalPeriod', Number(ethers.formatUnits(event.maxProposalPeriod,0)), txID); break; // checked
                        case EventType.min_proposal_period_update: await DbConfig.setConfig('MinProposalPeriod', Number(ethers.formatUnits(event.minProposalPeriod,0)), txID); break; // checked
                        case EventType.max_voting_tokens_update: await DbConfig.setConfig('MaxVotingTokens', Number(ethers.formatUnits(event.maxVotingTokens,0)), txID); break;
                        case EventType.proposal_created: await DbProposal.createProposal(Number(ethers.formatUnits(event.proposalId, 0)), event.proposer, event.description, event.options, Number(ethers.formatUnits(event.startTime, 0)), Number(ethers.formatUnits(event.endTime,0)), Number(ethers.formatUnits(event.rewardTokenAmount, 18)), Number(ethers.formatUnits(event.tfuelTokenAmount, 18)), txID, this.provider); break; // checked
                        case EventType.proposal_canceled: await DbProposal.cancelProposal(Number(ethers.formatUnits(event.proposalId, 0))); break;
                        case EventType.vote_cast: await DbVote.vote(Number(ethers.formatUnits(event.proposalId, 0)), event.voter, Number(ethers.formatUnits(event.option, 0)), Number(ethers.formatUnits(event.votes, 0)), txID); break;
                    }
                    console.log("Event", event)
                    // logEvents.push({ event, log });
                    // txIsInteresting = true;
                    // if (event.event === EventType.mint) {
                    //     mintEventCount += 1;
                    // } else if (event.event > EVENTTYPE_TRANSFER_THRESHOLD) { // this is not a transfer/mint/burn event
                    //     txContainsNonTransferEvent = true;
                    //     // if (event.event === EventType.tokenLocked || event.event === EventType.tokenUnlocked) {
                    //     //     txIsCrossChainLock = true;
                    //     // }
                    // }
                } else {
                    console.log("No event")
                    // logEvents.push({ log });
                }
            }
        }

        // for (const tx of transactions) {
        //     for (const contract of this.contracts) {
        //         for (const event of contract.events) {
        //             const logs = await this.provider.getLogs({
        //                 address: contract.address,
        //                 fromBlock: blockNumber,
        //                 toBlock: blockNumber,
        //                 topics: [ethers.utils.id(event.name)]
        //             });
        //
        //             // const iface = new ethers.Interface(contract.abi);
        //             // for (const log of logs) {
        //             //     try {
        //             //         const parsedLog = iface.parseLog(log);
        //             //         if (!parsedLog) {
        //             //             console.error(`Failed to parse log: ${log}`);
        //             //             continue;
        //             //         }
        //             //         const eventData = event.handler(parsedLog.args, parsedLog, tx);
        //             //         this.updateDatabase(eventData);
        //             //     } catch (error) {
        //             //         console.error(`Failed to parse log: ${log}`, error);
        //             //     }
        //             // }
        //         }
        //     }
        // }
    }

    private updateDatabase(eventData: any): void {
        const query = 'INSERT INTO Events (event, nftTokenAddress, nftTokenID, value, fromAddress, toAddress) VALUES (?, ?, ?, ?, ?, ?)';
        // db.query(query, [
        //     eventData.event,
        //     eventData.nftTokenAddress,
        //     eventData.nftTokenID,
        //     eventData.value.toString(),
        //     eventData.fromAddress,
        //     eventData.toAddress
        // ], (err, results) => {
        //     if (err) {
        //         console.error('Error inserting data into database:', err);
        //         return;
        //     }
        //     console.log('Data inserted successfully:', results);
        // });
    }
}

export default ContractScanner;