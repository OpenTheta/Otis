import { Proposal } from "../../routes/proposerInfo.js";
import DbProposal from "../../../database/api/DbProposal.js";

export interface AdminUpdateProposalQuery {
    update: AdminProposalUpdate;
}

export interface AdminUpdateProposalData {
    success: boolean;
    updatedProposal?: Proposal;
}

interface AdminProposalUpdate {
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

export default async function updateProposalRoute(query: AdminUpdateProposalQuery): Promise<AdminUpdateProposalData> {
    let isSuccess = await DbProposal.updateProposalAdmin(query.update.id, query.update.title, query.update.description, query.update.links, query.update.options);
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
    return {
        success:false,
    }
}