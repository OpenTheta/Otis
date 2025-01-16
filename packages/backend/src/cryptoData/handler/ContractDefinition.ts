import { ethers } from 'ethers';
import {ThetaLog, ThetaTransaction} from "../ThetaProvider.js";

export enum EventType {
    // these are technically all the same events ("Transfer")
    transfer_redundant = 0,
    transfer = 0,
    mint = 0,
    burn = 0,

    // V4R Contract Events
    proposal_created = 1,
    proposal_canceled = 2,
    vote_cast = 3,
    reward_claimed = 4,
    min_proposal_period_update = 5,
    max_proposal_period_update = 6,
    min_voting_period_update = 7,
    max_voting_period_update = 8,
    split_tfuel_owners_ratio_update = 9,
    pot_proposal_reward_ratio_update = 10,
    max_option_value_updated = 11,
    reward_token_updated = 12,
    token_info_updated = 13,
    proposer_role_updated = 14,
    max_voting_tokens_update = 15,

    // Lock Contract Events
    lockTNT20 = 20,
    lockTNT721 = 21,
    unlockTNT20 = 22,
    unlockTNT721 = 23,
}

interface AbstractEvent {
    tokenAddress: string;
    userAddress: string;
}

export interface BaseEvent extends AbstractEvent {
    event: EventType.mint | EventType.transfer | EventType.transfer_redundant | EventType.burn;
    toAddress: string;
}

export interface LockTNT20Events extends AbstractEvent {
    event: EventType.lockTNT20 | EventType.unlockTNT20;
    tokenAmount: bigint;
}

export interface LockTNT721Events extends AbstractEvent {
    event: EventType.lockTNT721 | EventType.unlockTNT721;
    tokenId: bigint;
}

export interface ProposalCreatedEvent {
    event: EventType.proposal_created;
    proposalId: bigint;
    proposer: string;
    description: string;
    options: string[];
    startTime: number;
    endTime: number;
    rewardTokenAmount: bigint;
    tfuelTokenAmount: bigint;
}

export interface ProposalCanceledEvent {
    event: EventType.proposal_canceled;
    proposalId: bigint;
}

export interface VoteCastEvent {
    event: EventType.vote_cast;
    voter: string;
    proposalId: bigint;
    option: number;
    votes: bigint;
}

export interface RewardClaimedEvent {
    event: EventType.reward_claimed;
    voter: string;
    proposalId: bigint;
    rewardTFuel: bigint;
    rewardToken: bigint;
}

export interface MinProposalPeriodUpdateEvent {
    event: EventType.min_proposal_period_update;
    minProposalPeriod: number;
}

export interface MaxProposalPeriodUpdateEvent {
    event: EventType.max_proposal_period_update;
    maxProposalPeriod: number;
}

export interface MinVotingPeriodUpdateEvent {
    event: EventType.min_voting_period_update;
    minVotingPeriod: number;
}

export interface MaxVotingPeriodUpdateEvent {
    event: EventType.max_voting_period_update;
    maxVotingPeriod: number;
}

export interface SplitTFuelOwnersRatioUpdateEvent {
    event: EventType.split_tfuel_owners_ratio_update;
    splitTFuelOwnersRatio: number;
}

export interface PotProposalRewardRatioUpdateEvent {
    event: EventType.pot_proposal_reward_ratio_update;
    potProposalRewardRatio: number;
}

export interface MaxOptionValueUpdatedEvent {
    event: EventType.max_option_value_updated;
    maxOptionValue: number;
}

export interface MaxVotingTokensUpdateEvent {
    event: EventType.max_voting_tokens_update;
    maxVotingTokens: number;
}

export interface RewardTokenUpdatedEvent {
    event: EventType.reward_token_updated;
    rewardToken: string;
    isRewardToken: boolean;
}

export interface TokenInfoUpdatedEvent {
    event: EventType.token_info_updated;
    tokenAddress: string;
    votingPower: bigint;
    lockAddress: string;
    isTNT20: boolean;
}

export interface ProposerRoleUpdatedEvent {
    event: EventType.proposer_role_updated;
    proposerAddress: string;
    isProposer: boolean;
}

type V4REvents = ProposalCreatedEvent | ProposalCanceledEvent | VoteCastEvent | RewardClaimedEvent |
    MinProposalPeriodUpdateEvent | MaxProposalPeriodUpdateEvent | MinVotingPeriodUpdateEvent | MaxVotingPeriodUpdateEvent |
    SplitTFuelOwnersRatioUpdateEvent | PotProposalRewardRatioUpdateEvent | MaxOptionValueUpdatedEvent | RewardTokenUpdatedEvent |
    TokenInfoUpdatedEvent | ProposerRoleUpdatedEvent | MaxVotingTokensUpdateEvent;

export type LogEvent = BaseEvent | LockTNT20Events | LockTNT721Events | V4REvents;

export type ContractEventHandler = (arg: { [x: string]: any }, log: ThetaLog, tx: ThetaTransaction) => LogEvent | null;

type SolidityType = 'address' | 'address[]' | 'bool' | 'bytes' | 'string' | 'uint8' | 'uint64' | 'uint256' | 'uint256[]' | 'string[]';

export interface AbiEventParameter {
    internalType?: SolidityType;
    name: string;
    type: SolidityType;
    indexed: boolean;
}

export interface AbiEvent {
    inputs: AbiEventParameter[];
    name: string;
    handler: ContractEventHandler;
}

// export interface EventInput {
//     indexed: boolean;
//     internalType: string;
//     name: string;
//     type: string;
// }
//
// export interface Event {
//     inputs: EventInput[];
//     name: string;
//     handler: ContractEventHandler;
// }

export default interface ContractDefinition {
    name: string;
    address: string;
    events: AbiEvent[];
}