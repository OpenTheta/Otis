import connection from "../db.js";
import {ResultSetHeader, RowDataPacket} from "mysql2/promise";

export default class DbTransactions {

    public static async ID(blockHeight: number, txHash: string, timestamp: number): Promise<number> {
        try {
            const [result] = await connection.execute<ResultSetHeader>(
                `INSERT INTO transactions (blockHeight, transactionHash, timestamp)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`,
                [blockHeight, txHash, new Date(timestamp * 1000)]
            );

            // Return the ID of the inserted or existing row
            return result.insertId;
        } catch (error) {
            console.error('Error inserting transaction:', error);
            throw error;
        }
    }
}