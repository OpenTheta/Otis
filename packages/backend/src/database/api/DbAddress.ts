import LRUCache from 'lru-cache';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import connection from "../db.js";

export function remove0xPrefix(str: string) {
    if (str.startsWith('0x')) {
        return str.slice(2);
    }
    return str;
}

const lruCache = new LRUCache<string, number>({
    max: 10000,
    ttl: 24 * 60 * 60 * 1000, // never...
});

export default class DbAddress {

    public static async ID(address: string, retrying=false): Promise<number> {
        address = address.toLowerCase();
        let cachedAddressID = lruCache.get(address);
        if (cachedAddressID) {
            return cachedAddressID;
        }
        const hexValue = remove0xPrefix(address);
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT ID FROM addresses WHERE address = UNHEX(?)`,
            [hexValue]
        );
        const adr = rows[0] as { ID: number };
        if (adr) {
            lruCache.set(address, adr.ID);
            return adr.ID;
        }
        // create address
        try {
            const [result] = await connection.execute<ResultSetHeader>(
                `INSERT INTO addresses (address) VALUES (UNHEX(?))`,
                [hexValue]
            );
            const addressID = result.insertId;
            lruCache.set(address, addressID);
            return addressID;
        } catch (err: any) {
            if (err.code === 'ER_DUP_ENTRY' && !retrying) { // race condition
                return this.ID(address, true);
            }
            throw err;
        }
    }

};