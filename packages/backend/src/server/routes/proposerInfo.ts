import ServerError from "../../helpers/ServerError.js";
import DbAddress from "../../database/api/DbAddress.js";
import DbProposer from "../../database/api/DbProposer.js";
import DbTokens from "../../database/api/DbTokens.js";
import DbProposal from "../../database/api/DbProposal.js";
import DbSettings from "../../database/api/DbSettings.js";

export interface ProposerInfoQuery {
    address: string;
}

export interface ProposerInfoData {
    address: string;
    isProposer: boolean;
    rewardTokens: Token[];
    votingTokens: Token[];
    pastProposals: Proposal[];
    settings: Settings;
}

// export interface Proposal {
//     id: number;
//     title: string;
//     description: string;
//     links: {
//         name: string;
//         link: string;
//     }[];
//     votes: number;
//     status: string;
//     startTimestamp: number;
//     endTimestamp: number;
//     proposer: string;
//     rewardTokens: {
//         name: string;
//         address: string | null;
//         amount: number;
//     }[];
//     votingTokens: {
//         name: string;
//         address: string;
//     }[];
//     options: {
//         name: string;
//         votes: number;
//     }[];
//     userVote?: number;
//     cancelled: boolean;
// }

export interface Proposal {
    id: number;
    title: string;
    description: string;
    onChainDescription: string;
    links: {
        name: string;
        link: string;
    }[];
    votes: number;
    status: "Cancelled" | "Waiting" | "Active" | "Ended";
    startTimestamp: number;
    endTimestamp: number;
    proposer: string;
    rewardToken: {
        name: string;
        address: string;
        amount: number;
    };
    tfuelPotAmount: number;
    votingTokens: {
        name: string;
        address: string;
        votingPower: number;
    }[];
    options: {
        id: number;
        name: string;
        onChainText: string;
        votes: number;
        onChainId: number;
    }[];
    cancelled: boolean;
    userVote?: {
        votes: number;
        optionID: number;
    };
}

interface Token {
    name: string;
    address: string;
}

export interface Settings {
    maxOptionValue: number;
    minProposalPeriod: number;
    maxProposalPeriod: number;
    minVotingPeriod: number;
    maxVotingPeriod: number;
    maxVotingTokens: number;
}

export default async function proposerInfoRoute(query: ProposerInfoQuery, req: any): Promise<ProposerInfoData> {
    const userAddress = req.user?.address as string|undefined;
    if (!userAddress) {
        throw new ServerError(500, 'Missing address');
    }
    if (userAddress.toLowerCase() !== query.address.toLowerCase()) {
        throw new ServerError(400, 'Invalid wallet address');
    }
    const userID = await DbAddress.ID(userAddress.toLowerCase());
    // Check if user address is a proposer
    const proposer = await DbProposer.isProposer(userID);
    const {rewardTokens, votingTokens} = await DbTokens.getTokens();
    const proposals = await DbProposal.getProposerProposals(proposer.id);
    const settings = await DbSettings.getSettings();

    return {
        address:userAddress.toLowerCase(),
        isProposer: proposer.isActive,
        rewardTokens: rewardTokens,
        votingTokens: votingTokens,
        pastProposals: proposals,
        settings: settings,
    }
}