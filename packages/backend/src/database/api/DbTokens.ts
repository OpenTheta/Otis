import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import connection from "../db.js";
import DbAddress from "./DbAddress.js";
import DbVoter from "./DbVoter.js";

export interface Token {
    name: string;
    address: string;
    votingPower?: number;
    isRewardToken?: boolean;
    isActive?: boolean;
}

export default class DbTokens {

    public static async ID(addressID: number): Promise<number> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT ID FROM tokens WHERE addressID = ?`,
            [addressID]
        );

        if(rows.length > 0 && rows[0].ID) {
            const {ID} = rows[0] as { ID: number };
            return ID
        } else {
            return -1
        }
    }

    public static async getTokenInfo(addressID: number): Promise<{id: number, name: string | null, votingPower: number, lockAddressID: number, isTNT20: boolean, isActive: boolean, isRewardToken: boolean}> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT * FROM tokens WHERE addressID = ?`,
            [addressID]
        );
        console.log(addressID, rows)
        if(rows.length > 0 && rows[0].id) {
            const res = rows[0] as { id: number, name: string | null, votingPower: number, lockAddressID: number, isTNT20: boolean, isActive: boolean, isRewardToken: boolean };
            return res
        } else {
            return { id: -1, name: null, votingPower: 0, lockAddressID: 0, isTNT20: false, isActive: false, isRewardToken: false }
        }
    }

    public static async getTokenID(addressID: number, lockAddressID?: number, isTNT20?: boolean): Promise<number> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT ID FROM tokens WHERE addressID = ?`,
            [addressID]
        );

        if(rows.length > 0 && rows[0].ID) {
            const {ID} = rows[0] as { ID: number };
            return ID
        } else {
            const [result] = await connection.execute<ResultSetHeader>(
                `INSERT INTO tokens (addressID, votingPower, lockAddressID, isTNT20, isActive, isRewardToken) VALUES (?, ?, ?, ?, ?, ?)`,
                [addressID, 0, lockAddressID, isTNT20, false, false]
            );
            return result.insertId;
        }
    }

    public static async lockTNT20Token(lockAddress: string, tokenAddress: string, userAddress: string, amount: number, txID: number): Promise<void> {
        const lockAddressID = await DbAddress.ID(lockAddress);
        const tokenAddressID = await DbAddress.ID(tokenAddress);
        const userAddressID = await DbAddress.ID(userAddress);
        const votingTokenID = await this.getTokenID(tokenAddressID, lockAddressID, true);
        const voterID = await DbVoter.ID(userAddressID);

        await connection.execute<ResultSetHeader>(
            `INSERT INTO tnt20_deposits (voterID, votingTokenID, amount, transactionID) VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE amount = amount + VALUES(amount), transactionID = VALUES(transactionID)`,
            [voterID, votingTokenID, amount, txID]
        );
    }

    public static async lockTNT721Token(lockAddress: string, tokenAddress: string, userAddress: string, tokenID: number, txID: number): Promise<void> {
        const lockAddressID = await DbAddress.ID(lockAddress);
        const tokenAddressID = await DbAddress.ID(tokenAddress);
        const userAddressID = await DbAddress.ID(userAddress);
        const votingTokenID = await this.getTokenID(tokenAddressID, lockAddressID, false);
        const voterID = await DbVoter.ID(userAddressID);

        await connection.execute<ResultSetHeader>(
            `INSERT INTO tnt721_deposits (tokenID, votingTokenID, voterID, transactionID) VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE votingTokenID = VALUES(votingTokenID), voterID = VALUES(voterID), transactionID = VALUES(transactionID)`,
            [tokenID, votingTokenID, voterID, txID]
        );
    }

    public static async unlockTNT20Token(lockAddress: string, tokenAddress: string, userAddress: string, amount: number): Promise<void> {
        const lockAddressID = await DbAddress.ID(lockAddress);
        const tokenAddressID = await DbAddress.ID(tokenAddress);
        const userAddressID = await DbAddress.ID(userAddress);
        const votingTokenID = await this.getTokenID(tokenAddressID, lockAddressID, true);
        const voterID = await DbVoter.ID(userAddressID);

        const [result] = await connection.execute<ResultSetHeader>(
            `UPDATE tnt20_deposits SET amount = GREATEST(0, amount - ?) WHERE voterID = ? AND votingTokenID = ?`,
            [amount, voterID, votingTokenID]
        );

        if (result.affectedRows === 0) {
            console.error(`Error: No existing record found for the given voterID ${voterID} and votingTokenID ${votingTokenID}.`);
        }
    }

    public static async unlockTNT721Token(lockAddress: string, tokenAddress: string, userAddress: string, tokenID: number): Promise<void> {
        const lockAddressID = await DbAddress.ID(lockAddress);
        const tokenAddressID = await DbAddress.ID(tokenAddress);
        const userAddressID = await DbAddress.ID(userAddress);
        const votingTokenID = await this.getTokenID(tokenAddressID, lockAddressID, false);
        const voterID = await DbVoter.ID(userAddressID);

        await connection.execute<ResultSetHeader>(
            `DELETE FROM tnt721_deposits WHERE tokenID = ? AND votingTokenID = ? AND voterID = ?`,
            [tokenID, votingTokenID, voterID]
        );
    }

    public static async updateTokenInfo(tokenAddress: string, votingPower: number, lockAddress: string, isTNT20: boolean): Promise<number> {
        const lockAddressID = await DbAddress.ID(lockAddress);
        const tokenAddressID = await DbAddress.ID(tokenAddress);
        const isActive = votingPower > 0;

        const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO tokens (addressID, votingPower, lockAddressID, isTNT20, isActive)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         lockAddressID = VALUES(lockAddressID),
         votingPower = VALUES(votingPower),
         isActive = VALUES(isActive)`,
            [tokenAddressID, votingPower, lockAddressID, isTNT20, isActive]
        );

        return result.insertId;
    }

    public static async updateRewardToken(tokenAddress: string, isRewardToken: boolean): Promise<number> {
        const tokenAddressID = await DbAddress.ID(tokenAddress);

        const [result] = await connection.execute<ResultSetHeader>(
            `UPDATE tokens SET isRewardToken = ? WHERE addressID = ?`,
            [isRewardToken, tokenAddressID]
        );

        if (result.affectedRows === 0) {
            console.error(`Error: No existing record found for the given tokenAddress ${tokenAddress}.`);
            return -1;
        }

        return result.insertId;
    }

    public static async getTokens(): Promise<{ rewardTokens: Token[]; votingTokens: Token[] }> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `
        SELECT 
            name,
            CONCAT('0x', LOWER(HEX((SELECT address FROM addresses WHERE addresses.id = tokens.addressID)))) AS address,
            votingPower, 
            isRewardToken, 
            isActive
        FROM 
            tokens
        WHERE 
            isActive = 1
        `
        );

        // Filter rows into rewardTokens and votingTokens
        const rewardTokens: Token[] = rows
            .filter((token) => token.isRewardToken)
            .map((token) => ({
                name: token.name ? token.name : token.address,
                address: token.address,
            }));

        const votingTokens: Token[] = rows
            .filter((token) => token.votingPower > 0)
            .map((token) => ({
                name: token.name ? token.name : token.address,
                address: token.address,
            }));

        return {
            rewardTokens,
            votingTokens,
        };
    }

    public static async getAllTokens(): Promise<Token[]> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `
        SELECT 
            name,
            CONCAT('0x', LOWER(HEX((SELECT address FROM addresses WHERE addresses.id = tokens.addressID)))) AS address,
            votingPower, 
            isRewardToken, 
            isActive
        FROM 
            tokens
        `
        );
        return rows as Token[];
    }

    public static async setName(tokenAddress: string, name: string): Promise<boolean> {
        const tokenAddressID = await DbAddress.ID(tokenAddress);
        const [result] = await connection.execute<ResultSetHeader>(
            `UPDATE tokens SET name = ? WHERE addressID = ?`,
            [name, tokenAddressID]
        );
        return result.affectedRows > 0;
    }

};