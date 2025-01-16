// Modify DbConfig class
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import connection from "../db.js";

// Update CONFIG_TYPE to include new configuration names
type CONFIG_TYPE =
    | 'MaxOptionValue'
    | 'PotProposalRewardRatio'
    | 'SplitTFuelOwnersRatio'
    | 'MaxVotingPeriod'
    | 'MinVotingPeriod'
    | 'MaxProposalPeriod'
    | 'MinProposalPeriod'
    | 'MaxVotingTokens'
    | 'blockHeight';

export default class DbConfig {

    public static async getConfig(name: CONFIG_TYPE): Promise<number> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT value FROM config WHERE name = ?`,
            [name]
        );
        if (rows.length > 0) {
            return rows[0].value;
        }
        throw new Error(`Config with name ${name} not found`);
    }

    // public static async setConfig(name: CONFIG_TYPE, value: number, txID: number): Promise<void> {
    //     await connection.execute<ResultSetHeader>(
    //         `INSERT INTO config (name, value) VALUES (?, ?)
    //          ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    //         [name, value]
    //     );
    // }
    public static async setConfig(name: CONFIG_TYPE, value: number, txID: number): Promise<void> {
        await connection.execute<ResultSetHeader>(
            `
        INSERT INTO config (name, value, transactionID)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            value = CASE
                WHEN (SELECT blockHeight FROM transactions WHERE id = ?) >
                     (SELECT blockHeight FROM transactions WHERE id = config.transactionID)
                THEN VALUES(value)
                ELSE value
            END,
            transactionID = CASE
                WHEN (SELECT blockHeight FROM transactions WHERE id = ?) >
                     (SELECT blockHeight FROM transactions WHERE id = config.transactionID)
                THEN VALUES(transactionID)
                ELSE transactionID
            END`,
            [name, value, txID, txID, txID]
        );
    }
}