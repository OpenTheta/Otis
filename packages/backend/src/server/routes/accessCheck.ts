import ServerError from "../../helpers/ServerError.js";
import DbProposer from "../../database/api/DbProposer.js";
import DbAddress from "../../database/api/DbAddress.js";

export interface AccessCheckQuery {
    address: string;
}

export interface AccessCheckData {
    address: string;
    isProposer: boolean;
    isAdmin: boolean;
}

export default async function accessCheckRoute(query: AccessCheckQuery, req: any): Promise<AccessCheckData> {
    const userAddress = query.address;

    // Ensure ADMIN_WALLETS environment variable is defined
    const adminWallets = process.env.ADMIN_WALLETS?.split(',').map((addr) => addr.toLowerCase()) || [];

    if (!userAddress) {
        throw new ServerError(500, 'Missing address');
    }

    const userID = await DbAddress.ID(userAddress.toLowerCase());
    // Check if user address is a proposer
    const proposer = await DbProposer.isProposer(userID);
    // Check if user address is an admin
    const isAdmin = adminWallets.includes(userAddress.toLowerCase());

    return {
        address: userAddress.toLowerCase(),
        isProposer: proposer.isActive,
        isAdmin: isAdmin,
    };
}