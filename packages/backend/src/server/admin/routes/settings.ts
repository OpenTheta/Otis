import DbSettings, {AdminSettings} from "../../../database/api/DbSettings.js";
import DbProposer, {Proposer} from "../../../database/api/DbProposer.js";
import DbTokens, {Token} from "../../../database/api/DbTokens.js";


export interface AdminSettingsQuery {}

export interface AdminSettingsData {
    settings: AdminSettings;
    proposers: Proposer[];
    tokens: Token[];
}

export default async function adminSettingsRoute(): Promise<AdminSettingsData> {
    const settings = await DbSettings.getAdminSettings();
    const proposers = await DbProposer.getAllProposers();
    const tokens = await DbTokens.getAllTokens();
    return {
        settings,
        proposers,
        tokens,
    };
}
