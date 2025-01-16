import ServerError from "../../helpers/ServerError.js";
import DbAddress from "../../database/api/DbAddress.js";
import DbProposer from "../../database/api/DbProposer.js";
import {Proposal} from "./proposerInfo.js";
import DbProposal from "../../database/api/DbProposal.js";

export interface UpdateProposalQuery {
    address: string;
    update: ProposalUpdate;
}

export interface UpdateProposalData {
    success: boolean;
    updatedProposal?: Proposal;
}

interface ProposalUpdate {
    id: number;
    title: string;
    description: string | null;
    links: {
        name: string;
        link: string;
    }[];
    options: {
        id: number;
        name: string | null;
        onChainText: string;
        votes: number;
    }[];
}

export default async function updateProposalRoute(query: UpdateProposalQuery, req: any): Promise<UpdateProposalData> {
    const userAddress = req.user?.address as string|undefined;
    let isSuccess = false;
    if (!userAddress) {
        throw new ServerError(500, 'Missing address in profileSet');
    }
    if (userAddress.toLowerCase() !== query.address.toLowerCase()) {
        throw new ServerError(400, 'Invalid wallet address');
    }
    // check if address is proposer
    const userAddressID = await DbAddress.ID(query.address);
    const proposer = await DbProposer.isProposer(userAddressID);
    if (proposer.isActive) {
        isSuccess = await DbProposal.updateProposal(proposer.id, query.update.id, query.update.title, query.update.description, query.update.links, query.update.options);
        if(isSuccess) {
            const proposal = await DbProposal.getProposal(query.update.id);
            if(proposal) {
                console.log("Proposal updated successfully");
                return {
                    success:isSuccess,
                    updatedProposal: proposal,
                }
            }
        }
    }
    return {
        success:false,
    }
}