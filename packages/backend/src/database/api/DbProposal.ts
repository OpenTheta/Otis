import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import connection from "../db.js";
import DbAddress from "./DbAddress.js";
import {getProposalData} from "../../cryptoData/BlockchainInteractions.js";
import DbTokens from "./DbTokens.js";
import {ethers} from "ethers";
import DbProposer from "./DbProposer.js";
import {Proposal} from "../../server/routes/proposerInfo.js";

type ProposalStatus = "Cancelled" | "Waiting" | "Active" | "Ended";

function mapProposals(rows: any[]): Proposal[] {
    const currentTime = Date.now() / 1000; // Current time in milliseconds
    return rows.map((row) => {
        let status: ProposalStatus;

        if (row.cancelled) {
            status = "Cancelled";
        } else if (currentTime < row.startTimestamp) {
            status = "Waiting";
        } else if (currentTime >= row.startTimestamp && currentTime <= row.endTimestamp) {
            status = "Active";
        } else {
            status = "Ended";
        }

        return {
            id: row.proposalId,
            title: row.title,
            description: row.description,
            onChainDescription: row.onChainDescription,
            links: Array.isArray(row.links)
                ? row.links
                : JSON.parse(row.links || "[]"),
            votes: row.numberOfVoters || 0,
            status: status,
            startTimestamp: row.startTimestamp * 1000,
            endTimestamp: row.endTimestamp * 1000,
            proposer: row.proposer.toString(),
            rewardToken: {
                name: row.rewardTokenName || "",
                address: row.rewardTokenAddress || null,
                amount: parseFloat(row.rewardTokenPotAmount || "0"),
            },
            tfuelPotAmount: parseFloat(row.tfuelPotAmount || "0"),
            votingTokens: Array.isArray(row.votingTokens)
                ? row.votingTokens
                : JSON.parse(row.votingTokens || "[]"),
            options: Array.isArray(row.options)
                ? row.options
                : JSON.parse(row.options || "[]"),
            cancelled: !!row.cancelled,
        };
    });
}

export default class DbProposal {

    public static async ID(addressID: number): Promise<number> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT ID FROM voters WHERE addressID = ?`,
            [addressID]
        );
        if(rows.length > 0 && rows[0].ID) {
            const {ID} = rows[0] as { ID: number };
            return ID
        }  else {
            return -1
        }
    }


    public static async createProposal(
        proposalID: number,
        proposer: string,
        description: string,
        options: string[],
        startTime: number,
        endTime: number,
        rewardTokenAmount: number,
        tfuelTokenAmount: number,
        txID: number,
        thetaProvider: ethers.FallbackProvider
    ): Promise<number> {
        const proposerID = await DbProposer.getProposerID(proposer);

        // Step 1: Insert or update proposal
        const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO proposals (
            id,
            proposerID,
            startTimestamp,
            endTimestamp,
            title,
            onChainDescription,
            numberOfVotingOptions,
            rewardTokenPotAmount,
            tfuelPotAmount,
            transactionID
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            proposerID = VALUES(proposerID),
            startTimestamp = VALUES(startTimestamp),
            endTimestamp = VALUES(endTimestamp),
            title = VALUES(title),
            onChainDescription = VALUES(onChainDescription),
            numberOfVotingOptions = VALUES(numberOfVotingOptions),
            rewardTokenPotAmount = VALUES(rewardTokenPotAmount),
            tfuelPotAmount = VALUES(tfuelPotAmount),
            transactionID = VALUES(transactionID)`,
            [
                proposalID,
                proposerID,
                startTime,
                endTime,
                `Proposal ${proposalID}`,
                description,
                options.length,
                rewardTokenAmount,
                tfuelTokenAmount,
                txID
            ]
        );

        if (!(result.insertId || result.affectedRows)) {
            return -1;
        }

        // Step 2: Batch insert options
        if (options.length > 0) {
            const optionValues = options.map((option, index) => `(${connection.escape(proposalID)}, ${connection.escape(option)}, ${connection.escape(index)})`).join(", ");
            await connection.query(
                `INSERT IGNORE INTO options (proposalID, onChainText, onChainID) VALUES ${optionValues}`
            );
        }

        // Step 3: Fetch additional proposal info from blockchain
        const proposalData = await getProposalData(proposalID, thetaProvider);
        // Step 4: Update reward token in proposals table
        const rewardTokenAddressID = await DbAddress.ID(proposalData.rewardToken);
        const rewardTokenID = await DbTokens.ID(rewardTokenAddressID);
        await connection.execute(
            `UPDATE proposals
         SET rewardTokenID = ?
         WHERE id = ?`,
            [rewardTokenID, proposalID]
        );

        // Step 5: Batch insert voting tokens
        if (proposalData.votingTokens.length > 0) {
            const votingTokenValues = await Promise.all(
                proposalData.votingTokens.map(async (tokenAddress: string) => {
                    const addressID = await DbAddress.ID(tokenAddress);
                    const tokenInfo = await DbTokens.getTokenInfo(addressID);
                    return `(${connection.escape(proposalID)}, ${connection.escape(tokenInfo.id)}, ${connection.escape(tokenInfo.votingPower)})`;
                })
            );
            await connection.query(
                `INSERT IGNORE INTO voting_tokens (proposalID, tokenID, votingPower) VALUES ${votingTokenValues.join(", ")}`
            );
        }

        // Step 6: Update proposer with incremented proposal count
        await connection.execute(
            `UPDATE proposers
         SET numberOfProposals = numberOfProposals + 1
         WHERE id = ?`,
            [proposerID]
        );

        return proposalID;
    }

    public static async cancelProposal(proposalID: number): Promise<boolean> {
        try {
            await connection.execute(
                `UPDATE proposals
             SET cancelled = ?
             WHERE id = ?`,
                [true, proposalID]
            );
            return true;
        } catch {
            return false
        }
    }

    public static async getProposerProposals(proposerID: number): Promise<Proposal[]> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `
            SELECT
                p.id AS proposalId,
                p.title,
                p.description,
                p.onChainDescription,
                p.links,
                p.startTimestamp,
                p.endTimestamp,
                p.cancelled,
                p.tfuelPotAmount,
                t.name AS rewardTokenName,
                CONCAT('0x', LOWER(HEX(a.address))) AS rewardTokenAddress,
                p.rewardTokenPotAmount,
                CONCAT('0x', LOWER(HEX(pa.address))) AS proposer,
                -- Subquery to aggregate options
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT('id', o.id, 'name', o.text, 'onChainText', o.onChainText, 'votes', o.votes, 'onChainId', o.onChainID)
                    )
                    FROM options o
                    WHERE o.proposalID = p.id
                ) AS options,
                -- Subquery to aggregate voting tokens
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'name', vt_token.name,
                            'address', CONCAT('0x', LOWER(HEX(va.address))),
                            'votingPower', vt.votingPower
                        )
                    )
                    FROM voting_tokens vt
                    LEFT JOIN tokens vt_token ON vt.tokenID = vt_token.id
                    LEFT JOIN addresses va ON vt_token.addressID = va.id
                    WHERE vt.proposalID = p.id
                ) AS votingTokens
            FROM
                proposals p
            LEFT JOIN tokens t ON p.rewardTokenID = t.id
            LEFT JOIN addresses a ON t.addressID = a.id
            LEFT JOIN proposers pr ON p.proposerID = pr.id
            LEFT JOIN addresses pa ON pr.addressID = pa.id
            WHERE
                p.proposerID = ?
            GROUP BY
                p.id;
            `,
            [proposerID]
        );

        // Map rows into Proposal objects
        return mapProposals(rows);
        // return rows.map((row) => {
        //     const currentTime = Date.now(); // Current time in milliseconds
        //     let status: "Cancelled" | "Waiting" | "Active" | "Ended";
        //
        // if (row.cancelled) {
        //     status = "Cancelled";
        // } else if (currentTime < new Date(row.startTimestamp).getTime()) {
        //     status = "Waiting";
        // } else if (currentTime >= new Date(row.startTimestamp).getTime() && currentTime <= new Date(row.endTimestamp).getTime()) {
        //     status = "Active";
        // } else {
        //     status = "Ended";
        // }
        // return {
        //     id: row.proposalId,
        //     title: row.title,
        //     description: row.description,
        //     onChainDescription: row.onChainDescription,
        //     links: Array.isArray(row.links)
        //         ? row.links
        //         : JSON.parse(row.links || "[]"),
        //     votes: row.numberOfVoters || 0,
        //     status: status,
        //     startTimestamp: row.startTimestamp,
        //     endTimestamp: row.endTimestamp,
        //     proposer: row.proposer.toString(), // Convert proposerID if necessary
        //     rewardToken: {
        //         name: row.rewardTokenName || "",
        //         address: row.rewardTokenAddress || null,
        //         amount: parseFloat(row.rewardTokenPotAmount || "0"),
        //     },
        //     tfuelPotAmount: parseFloat(row.tfuelPotAmount || "0"),
        //     votingTokens: Array.isArray(row.votingTokens)
        //         ? row.votingTokens
        //         : JSON.parse(row.votingTokens || "[]"),
        //     options: Array.isArray(row.options)
        //         ? row.options
        //         : JSON.parse(row.options || "[]"),
        //     cancelled: !!row.cancelled,
        // }
        // })
    }

    public static async updateProposal(proposerID: number, proposalID: number, title: string, description: string | null, links: { name: string, link: string }[], options: { id: number, name: string | null, onChainText: string, votes: number }[]): Promise<boolean> {
        try {
            await connection.execute(
                `UPDATE proposals
             SET title = ?,
                 description = ?,
                 links = ?
             WHERE id = ? AND proposerID = ?`,
                [title, description, JSON.stringify(links), proposalID, proposerID]
            );
            // updateOptions
            for (const option of options) {
                await connection.execute(
                    `UPDATE options
                 SET text = ?
                 WHERE id = ?`,
                    [option.name, option.id]
                );
            }
            return true;
        } catch(e) {
            console.log(e);
            return false;
        }
    }

    public static async updateProposalAdmin(proposalID: number, title: string, description: string | null, links: { name: string, link: string }[], options: { id: number, name: string | null, onChainText: string, votes: number }[]): Promise<boolean> {
        try {
            await connection.execute(
                `UPDATE proposals
             SET title = ?,
                 description = ?,
                 links = ?
             WHERE id = ?`,
                [title, description, JSON.stringify(links), proposalID]
            );
            // updateOptions
            for (const option of options) {
                await connection.execute(
                    `UPDATE options
                 SET text = ?
                 WHERE id = ?`,
                    [option.name, option.id]
                );
            }
            return true;
        } catch(e) {
            console.log(e);
            return false;
        }
    }

    public static async getProposal(proposalID: number): Promise<Proposal | null> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `
            SELECT
                p.id AS proposalId,
                p.title,
                p.description,
                p.onChainDescription,
                p.links,
                p.startTimestamp,
                p.endTimestamp,
                p.cancelled,
                p.tfuelPotAmount,
                t.name AS rewardTokenName,
                CONCAT('0x', LOWER(HEX(a.address))) AS rewardTokenAddress,
                p.rewardTokenPotAmount,
                CONCAT('0x', LOWER(HEX(pa.address))) AS proposer,
                -- Subquery to aggregate options
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT('id', o.id, 'name', o.text, 'onChainText', o.onChainText, 'votes', o.votes, 'onChainId', o.onChainID)
                    )
                    FROM options o
                    WHERE o.proposalID = p.id
                ) AS options,
                -- Subquery to aggregate voting tokens
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'name', vt_token.name,
                            'address', CONCAT('0x', LOWER(HEX(va.address))),
                            'votingPower', vt.votingPower
                        )
                    )
                    FROM voting_tokens vt
                    LEFT JOIN tokens vt_token ON vt.tokenID = vt_token.id
                    LEFT JOIN addresses va ON vt_token.addressID = va.id
                    WHERE vt.proposalID = p.id
                ) AS votingTokens
            FROM
                proposals p
            LEFT JOIN tokens t ON p.rewardTokenID = t.id
            LEFT JOIN addresses a ON t.addressID = a.id
            LEFT JOIN proposers pr ON p.proposerID = pr.id
            LEFT JOIN addresses pa ON pr.addressID = pa.id
            WHERE
                p.id = ?
            `,
            [proposalID]
        );

        if (rows.length === 0) {
            return null;
        } else {
            const proposals = mapProposals(rows)
            return proposals[0];
            // const row = rows[0];
            // const currentTime = Date.now(); // Current time in milliseconds
            // let status: "Cancelled" | "Waiting" | "Active" | "Ended";
            //
            // if (row.cancelled) {
            //     status = "Cancelled";
            // } else if (currentTime < new Date(row.startTimestamp).getTime()) {
            //     status = "Waiting";
            // } else if (currentTime >= new Date(row.startTimestamp).getTime() && currentTime <= new Date(row.endTimestamp).getTime()) {
            //     status = "Active";
            // } else {
            //     status = "Ended";
            // }
            // return {
            //     id: row.proposalId,
            //     title: row.title,
            //     description: row.description,
            //     onChainDescription: row.onChainDescription,
            //     links: Array.isArray(row.links)
            //         ? row.links
            //         : JSON.parse(row.links || "[]"),
            //     votes: row.numberOfVoters || 0,
            //     status: status,
            //     startTimestamp: row.startTimestamp,
            //     endTimestamp: row.endTimestamp,
            //     proposer: row.proposer.toString(), // Convert proposerID if necessary
            //     rewardToken: {
            //         name: row.rewardTokenName || "",
            //         address: row.rewardTokenAddress || null,
            //         amount: parseFloat(row.rewardTokenPotAmount || "0"),
            //     },
            //     tfuelPotAmount: parseFloat(row.tfuelPotAmount || "0"),
            //     votingTokens: Array.isArray(row.votingTokens)
            //         ? row.votingTokens
            //         : JSON.parse(row.votingTokens || "[]"),
            //     options: Array.isArray(row.options)
            //         ? row.options
            //         : JSON.parse(row.options || "[]"),
            //     cancelled: !!row.cancelled,
            // }
        }
    }

    public static async getProposals(page: number = 1, limit: number = 10): Promise<{proposals: Proposal[], pastProposals: Proposal[]}> {
        const currentTime = Math.floor(Date.now() / 1000); // Current time in milliseconds
        // active proposals
        const [rows] = await connection.execute<RowDataPacket[]>(
            `
            SELECT
                p.id AS proposalId,
                p.title,
                p.description,
                p.onChainDescription,
                p.links,
                p.startTimestamp,
                p.endTimestamp,
                p.cancelled,
                p.tfuelPotAmount,
                t.name AS rewardTokenName,
                CONCAT('0x', LOWER(HEX(a.address))) AS rewardTokenAddress,
                p.rewardTokenPotAmount,
                CONCAT('0x', LOWER(HEX(pa.address))) AS proposer,
                -- Subquery to aggregate options
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT('id', o.id, 'name', o.text, 'onChainText', o.onChainText, 'votes', o.votes, 'onChainId', o.onChainID)
                    )
                    FROM options o
                    WHERE o.proposalID = p.id
                ) AS options,
                -- Subquery to aggregate voting tokens
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'name', vt_token.name,
                            'address', CONCAT('0x', LOWER(HEX(va.address))),
                            'votingPower', vt.votingPower
                        )
                    )
                    FROM voting_tokens vt
                    LEFT JOIN tokens vt_token ON vt.tokenID = vt_token.id
                    LEFT JOIN addresses va ON vt_token.addressID = va.id
                    WHERE vt.proposalID = p.id
                ) AS votingTokens
            FROM
                proposals p
            LEFT JOIN tokens t ON p.rewardTokenID = t.id
            LEFT JOIN addresses a ON t.addressID = a.id
            LEFT JOIN proposers pr ON p.proposerID = pr.id
            LEFT JOIN addresses pa ON pr.addressID = pa.id
            WHERE p.cancelled = 0 AND p.endTimestamp > ?
            GROUP BY p.id, p.startTimestamp
            ORDER BY p.startTimestamp ASC;
            `, [currentTime]
        );

        // Map rows into Proposal objects
        const activeProposals = mapProposals(rows);

        // past proposals (paged)
        const offset = (page ?? 0) * limit;

        const [row2] = await connection.execute<RowDataPacket[]>(
            `
        SELECT
            p.id AS proposalId,
            p.title,
            p.description,
            p.onChainDescription,
            p.links,
            p.startTimestamp,
            p.endTimestamp,
            p.cancelled,
            p.tfuelPotAmount,
            t.name AS rewardTokenName,
            CONCAT('0x', LOWER(HEX(a.address))) AS rewardTokenAddress,
            p.rewardTokenPotAmount,
            CONCAT('0x', LOWER(HEX(pa.address))) AS proposer,
            -- Subquery to aggregate options
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT('id', o.id, 'name', o.text, 'onChainText', o.onChainText, 'votes', o.votes, 'onChainId', o.onChainID)
                )
                FROM options o
                WHERE o.proposalID = p.id
            ) AS options,
            -- Subquery to aggregate voting tokens
            (
                SELECT JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'name', vt_token.name,
                        'address', CONCAT('0x', LOWER(HEX(va.address))),
                        'votingPower', vt.votingPower
                    )
                )
                FROM voting_tokens vt
                LEFT JOIN tokens vt_token ON vt.tokenID = vt_token.id
                LEFT JOIN addresses va ON vt_token.addressID = va.id
                WHERE vt.proposalID = p.id
            ) AS votingTokens
        FROM
            proposals p
        LEFT JOIN tokens t ON p.rewardTokenID = t.id
        LEFT JOIN addresses a ON t.addressID = a.id
        LEFT JOIN proposers pr ON p.proposerID = pr.id
        LEFT JOIN addresses pa ON pr.addressID = pa.id
        WHERE p.cancelled = 1 OR p.endTimestamp < ?
        GROUP BY p.id, p.endTimestamp
        ORDER BY p.endTimestamp ASC
        LIMIT ${offset}, ${limit};
        `, [currentTime]
        );
        // Map rows into Proposal objects
        const pastProposals = mapProposals(row2);

        return {
            proposals: activeProposals,
            pastProposals: pastProposals,
        }
    }
};