import {ResultSetHeader, RowDataPacket} from 'mysql2/promise';
import connection from "../db.js";
import DbAddress from "./DbAddress.js";

export interface Proposer {
    id: number;
    address: string;
    numberOfProposals: number;
    isActive: boolean;
}

export default class DbProposer {

    public static async ID(addressID: number): Promise<number> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT ID FROM proposers WHERE addressID = ?`,
            [addressID]
        );
        if(rows.length > 0 && rows[0].ID) {
            const {ID} = rows[0] as { ID: number };
            return ID
        }  else {
            const [result] = await connection.execute<ResultSetHeader>(
                `INSERT INTO voters (addressID) VALUES (?)`,
                [addressID]
            );
            return result.insertId;
        }
    }

    public static async isProposer(addressID: number): Promise<{ id: number, numberOfProposals: number, isActive: boolean }> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT * FROM proposers WHERE addressID = ?`,
            [addressID]
        );
        if(rows.length > 0 && rows[0].id) {
            return rows[0] as { id: number, numberOfProposals: number, isActive: boolean }
        }  else {
            return { id: -1, numberOfProposals: 0, isActive: false }
        }
    }

    public static async updateProposer(address: string, isActive: boolean): Promise<number> {
        const addressID = await DbAddress.ID(address);
        const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO proposers (addressID, isActive) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE isActive = VALUES(isActive)`,
            [addressID, isActive]
        );
        if(result.insertId) {
            return result.insertId;
        }
        return -1;
    }

    public static async getProposerID(address: string): Promise<number> {
        const addressID = await DbAddress.ID(address);
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT id FROM proposers WHERE addressID = ?`,
            [addressID]
        );
        if(rows.length > 0 && rows[0].id) {
            const {id} = rows[0] as { id: number };
            return id
        } else {
            return -1
        }
    }

    public static async getAllProposers(): Promise<Proposer[]> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT 
                proposers.id,
                CONCAT('0x', LOWER(HEX(addresses.address))) as address,
                numberOfProposals,
                isActive
            FROM proposers
            JOIN addresses ON proposers.addressID = addresses.ID`,
        );
        return rows as Proposer[];
    }
};