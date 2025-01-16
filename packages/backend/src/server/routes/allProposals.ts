import DbProposal from "../../database/api/DbProposal.js";
import DbSettings from "../../database/api/DbSettings.js";
import {Proposal} from "./proposerInfo.js";

export interface AllProposalsQuery {
    page?: number;
    limit?: number;
}

export interface AllProposalsData {
    proposals: Proposal[];
    pastProposals: Proposal[];
}

export default async function allProposalsRoute(query: AllProposalsQuery, req: any): Promise<AllProposalsData> {
    const {proposals, pastProposals} = await DbProposal.getProposals(req.query.page, req.query.limit);

    return {
        proposals,
        pastProposals,
    }
}