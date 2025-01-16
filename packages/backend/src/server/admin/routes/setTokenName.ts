import DbTokens, {Token} from "../../../database/api/DbTokens.js";


export interface AdminSetTokenNameQuery {
    tokenAddress: string;
    name: string;
}

export interface AdminSetTokenNameData {
    success: boolean;
}

export default async function adminSetTokenNameRoute(query: AdminSetTokenNameQuery): Promise<AdminSetTokenNameData> {
    const isSuccess = await DbTokens.setName(query.tokenAddress, query.name);
    return {
        success: isSuccess
    };
}
