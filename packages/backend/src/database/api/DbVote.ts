import connection from "../db.js";
import {ResultSetHeader, RowDataPacket} from "mysql2/promise";
import DbAddress from "./DbAddress.js";
import DbVoter from "./DbVoter.js";

export default class DbVote {

    public static async vote(proposalID: number, voter: string, optionID: number, votes: number, txID: number): Promise<boolean> {
        const voterAddressID = await DbAddress.ID(voter);
        const voterID = await DbVoter.ID(voterAddressID);
        try {
            await connection.execute(
                `INSERT INTO votes (proposalID, voterID, optionID, votes, transactionID) VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE votes = votes + VALUES(votes), transactionID = VALUES(transactionID)`,
                [proposalID, voterID, optionID, votes, txID]
            );
            return true
        } catch {
            return false
        }
    }
}