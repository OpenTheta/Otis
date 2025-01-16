import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import connection from "../db.js";
import {Settings} from "../../server/routes/proposerInfo.js";

export interface AdminSettings {
    blockHeight: number;
    maxOptionValue: number;
    maxProposalPeriod: number;
    minProposalPeriod: number;
    maxVotingPeriod: number;
    minVotingPeriod: number;
    maxVotingTokens: number;
    potProposalRewardRatio: number;
    splitTFuelOwnersRatio: number;
}

export default class DbSettings {
    public static async getSettings(): Promise<Settings> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `
        SELECT name, value 
        FROM config 
        WHERE name IN (
            'MaxOptionValue', 
            'MinProposalPeriod', 
            'MaxProposalPeriod', 
            'MinVotingPeriod', 
            'MaxVotingPeriod', 
            'MaxVotingTokens'
        )
        `
        );

        const settings: Partial<Settings> = {};

        // Map the results into the settings object
        rows.forEach((row) => {
            const key = row.name.charAt(0).toLowerCase() + row.name.slice(1);
            settings[key as keyof Settings] = row.value;
        });

        // Ensure all required keys are present
        return settings as Settings;
    }

    public static async getAdminSettings(): Promise<AdminSettings> {
        const [rows] = await connection.execute<RowDataPacket[]>(
            `
        SELECT name, value 
        FROM config 
        WHERE name IN (
            'BlockHeight',
            'MaxOptionValue', 
            'MinProposalPeriod', 
            'MaxProposalPeriod', 
            'MinVotingPeriod', 
            'MaxVotingPeriod', 
            'MaxVotingTokens',
            'PotProposalRewardRatio',
            'SplitTFuelOwnersRatio'
        )
        `
        );

        const settings: Partial<Settings> = {};

        // Map the results into the settings object
        rows.forEach((row) => {
            const key = row.name.charAt(0).toLowerCase() + row.name.slice(1);
            settings[key as keyof Settings] = row.value;
        });

        // Ensure all required keys are present
        return settings as AdminSettings;
    }
};