import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import connection from "../db.js";

export default class DbVoter {

    public static async ID(addressID: number): Promise<number> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT ID FROM voters WHERE addressID = ?`,
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
};