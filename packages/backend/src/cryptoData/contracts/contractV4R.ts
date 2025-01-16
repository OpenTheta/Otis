import { ethers } from 'ethers';
import ContractDefinition, { EventType } from '../handler/ContractDefinition.js';

const contractV4R: ContractDefinition = {
    name: 'V4R',
    address: '0x90632afc1a70d65bad19334d1f31ac671e80c830',
    events: [
        {
            inputs: [
                { indexed: true, internalType: 'uint256', name: 'id', type: 'uint256' },
                { indexed: true, internalType: 'address', name: 'proposer', type: 'address' },
                { indexed: false, internalType: 'string', name: 'description', type: 'string' },
                { indexed: false, internalType: 'string[]', name: 'votingOptions', type: 'string[]' },
                { indexed: false, internalType: 'uint256', name: 'startTime', type: 'uint256' },
                { indexed: false, internalType: 'uint256', name: 'endTime', type: 'uint256' },
                { indexed: false, internalType: 'uint256', name: 'proposalTokenRatioAmount', type: 'uint256' },
                { indexed: false, internalType: 'uint256', name: 'proposaltFuelRatioAmount', type: 'uint256' }
            ],
            name: 'ProposalCreated',
            handler: (event) => ({
                event: EventType.proposal_created,
                proposalId: event.id,
                proposer: event.proposer,
                description: event.description,
                options: event.votingOptions,
                startTime: event.startTime,
                endTime: event.endTime,
                rewardTokenAmount: event.proposalTokenRatioAmount,
                tfuelTokenAmount: event.proposaltFuelRatioAmount,
            }),
        },
        {
            inputs: [
                { indexed: true, internalType: 'uint256', name: 'id', type: 'uint256' }
            ],
            name: 'ProposalCanceled',
            handler: (event) => ({
                event: EventType.proposal_canceled,
                proposalId: event.id,
            }),
        },
        {
            inputs: [
                { indexed: true, internalType: 'address', name: 'voter', type: 'address' },
                { indexed: true, internalType: 'uint256', name: 'proposalId', type: 'uint256' },
                { indexed: false, internalType: 'uint8', name: 'option', type: 'uint8' },
                { indexed: false, internalType: 'uint256', name: 'votes', type: 'uint256' }
            ],
            name: 'VoteCast',
            handler: (event) => ({
                event: EventType.vote_cast,
                voter: event.voter,
                proposalId: event.proposalId,
                option: event.option,
                votes: event.votes,
            }),
        },
        {
            inputs: [
                { indexed: true, internalType: 'address', name: 'voter', type: 'address' },
                { indexed: true, internalType: 'uint256', name: 'proposalId', type: 'uint256' },
                { indexed: false, internalType: 'uint256', name: 'rewardTFuel', type: 'uint256' },
                { indexed: false, internalType: 'uint256', name: 'rewardToken', type: 'uint256' }
            ],
            name: 'RewardClaimed',
            handler: (event) => ({
                event: EventType.reward_claimed,
                voter: event.voter,
                proposalId: event.proposalId,
                rewardTFuel: event.rewardTFuel,
                rewardToken: event.rewardToken,
            }),
        },
        {
            inputs: [
                { indexed: false, internalType: 'uint256', name: 'newMinProposalPeriod', type: 'uint256' }
            ],
            name: 'MinProposalPeriodUpdated',
            handler: (event) => ({
                event: EventType.min_proposal_period_update,
                minProposalPeriod: event.newMinProposalPeriod,
            }),
        },
        {
            inputs: [
                { indexed: false, internalType: 'uint256', name: 'newMinVotingPeriod', type: 'uint256' }
            ],
            name: 'MinVotingPeriodUpdated',
            handler: (event) => ({
                event: EventType.min_voting_period_update,
                minVotingPeriod: event.newMinVotingPeriod,
            }),
        },
        {
            inputs: [
                { indexed: false, internalType: 'uint256', name: 'newMaxProposalPeriod', type: 'uint256' }
            ],
            name: 'MaxProposalPeriodUpdated',
            handler: (event) => ({
                event: EventType.max_proposal_period_update,
                maxProposalPeriod: event.newMaxProposalPeriod,
            }),
        },
        {
            inputs: [
                { indexed: false, internalType: 'uint256', name: 'newMaxVotingPeriod', type: 'uint256' }
            ],
            name: 'MaxVotingPeriodUpdated',
            handler: (event) => ({
                event: EventType.max_voting_period_update,
                maxVotingPeriod: event.newMaxVotingPeriod,
            }),
        },
        {
            inputs: [
                { indexed: false, internalType: 'uint256', name: 'newSplitTFuelOwnersRatio', type: 'uint256' }
            ],
            name: 'SplitTFuelOwnersRatioUpdated',
            handler: (event) => ({
                event: EventType.split_tfuel_owners_ratio_update,
                splitTFuelOwnersRatio: event.newSplitTFuelOwnersRatio,
            }),
        },
        {
            inputs: [
                { indexed: false, internalType: 'uint256', name: 'newPotProposalRewardRatio', type: 'uint256' }
            ],
            name: 'PotProposalRewardRatioUpdated',
            handler: (event) => ({
                event: EventType.pot_proposal_reward_ratio_update,
                potProposalRewardRatio: event.newPotProposalRewardRatio,
            }),
        },
        {
            inputs: [
                { indexed: false, internalType: 'uint256', name: 'newMaxOptionValue', type: 'uint256' }
            ],
            name: 'MaxOptionValueUpdated',
            handler: (event) => ({
                event: EventType.max_option_value_updated,
                maxOptionValue: event.newMaxOptionValue,
            }),
        },
        {
            inputs: [
                { indexed: false, internalType: 'uint256', name: 'newMaxVotingTokens', type: 'uint256' }
            ],
            name: 'MaxVotingTokensUpdated',
            handler: (event) => ({
                event: EventType.max_voting_tokens_update,
                maxVotingTokens: event.newMaxVotingTokens,
            }),
        },
        {
            inputs: [
                { indexed: false, internalType: 'address', name: 'newRewardToken', type: 'address' },
                { indexed: false, internalType: 'bool', name: 'status', type: 'bool' }
            ],
            name: 'RewardTokenUpdated',
            handler: (event) => ({
                event: EventType.reward_token_updated,
                rewardToken: event.newRewardToken,
                isRewardToken: event.status,
            }),
        },
        {
            inputs: [
                { indexed: true, internalType: 'address', name: 'token', type: 'address' },
                { indexed: false, internalType: 'uint256', name: 'votingPower', type: 'uint256' },
                { indexed: false, internalType: 'address', name: 'lockAddress', type: 'address' },
                { indexed: false, internalType: 'bool', name: 'isTNT20', type: 'bool' }
            ],
            name: 'TokenInfoUpdated',
            handler: (event) => ({
                event: EventType.token_info_updated,
                tokenAddress: event.token,
                votingPower: event.votingPower,
                lockAddress: event.lockAddress,
                isTNT20: event.isTNT20,
            }),
        },
        {
            inputs: [
                { indexed: true, internalType: 'address', name: 'proposer', type: 'address' },
                { indexed: true, internalType: 'bool', name: 'status', type: 'bool' },
            ],
            name: 'ProposerRoleUpdated',
            handler: (event) => ({
                event: EventType.proposer_role_updated,
                proposerAddress: event.proposer,
                isProposer: event.status,
            }),
        },
    ]
};

export default contractV4R;

