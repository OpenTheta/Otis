import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

const createDatabase = `CREATE DATABASE IF NOT EXISTS oties_v4r_test_db`;

const configEntries = [
    { name: 'MaxOptionValue', value: 8 },
    { name: 'PotProposalRewardRatio', value: 100 },
    { name: 'SplitTFuelOwnersRatio', value: 500 },
    { name: 'MaxVotingPeriod', value: 1209600 },
    { name: 'MinVotingPeriod', value: 604800 },
    { name: 'MaxProposalPeriod', value: 1209600 },
    { name: 'MinProposalPeriod', value: 604800 },
    { name: 'MaxVotingTokens', value: 4 },
    { name: 'blockHeight', value: 0 }
];

connection.query(createDatabase, (err, results) => {
    if (err) {
        console.error('Error creating database:', err);
        return;
    }
    console.log('Database created or already exists.');

    // Connect to the newly created database
    connection.changeUser({ database: 'oties_v4r_test_db' }, (err) => {
        if (err) {
            console.error('Error changing database:', err);
            return;
        }
        console.log('Connected to the oties_v4r_test_db database.');

        const createTables = [
            `CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                blockHeight INT NOT NULL,
                transactionHash VARCHAR(255) NOT NULL UNIQUE,
                timestamp DATETIME NOT NULL
            );`,
            `CREATE TABLE IF NOT EXISTS addresses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                address BINARY(20) NOT NULL UNIQUE
            )`,
            `CREATE TABLE IF NOT EXISTS tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                addressID INT NOT NULL UNIQUE,
                votingPower INT NOT NULL,
                lockAddressID INT NOT NULL,
                isTNT20 BOOLEAN NOT NULL,
                isActive BOOLEAN DEFAULT TRUE,
                isRewardToken BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (addressID) REFERENCES addresses(id),
                FOREIGN KEY (lockAddressID) REFERENCES addresses(id)
            )`,
            `CREATE TABLE IF NOT EXISTS proposers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                addressID INT NOT NULL UNIQUE,
                numberOfProposals INT DEFAULT 0,
                isActive BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (addressID) REFERENCES addresses(id)
            )`,
            `CREATE TABLE IF NOT EXISTS voters (
                id INT AUTO_INCREMENT PRIMARY KEY,
                addressID INT NOT NULL,
                numberOfProposalsVotedOn INT DEFAULT 0,
                FOREIGN KEY (addressID) REFERENCES addresses(id)
            )`,
            `CREATE TABLE IF NOT EXISTS proposals (
                id INT NOT NULL UNIQUE PRIMARY KEY,
                proposerID INT NOT NULL,
                startTimestamp INT NOT NULL,
                endTimestamp INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                onChainDescription TEXT,
                description TEXT,
                links TEXT,
                rewardTokenID INT,
                numberOfVotingOptions INT DEFAULT 0,
                tfuelPotAmount DECIMAL(18, 8) NOT NULL DEFAULT 0,
                rewardTokenPotAmount DECIMAL(18, 8) NOT NULL DEFAULT 0,
                numberOfVoters INT DEFAULT 0,
                cancelled BOOLEAN DEFAULT FALSE,
                transactionID INT NOT NULL,
                FOREIGN KEY (proposerID) REFERENCES proposers(id),
                FOREIGN KEY (rewardTokenID) REFERENCES tokens(id),
                FOREIGN KEY (transactionID) REFERENCES transactions(id)
            )`,
            `CREATE TABLE IF NOT EXISTS options (
                id INT AUTO_INCREMENT PRIMARY KEY,
                proposalID INT NOT NULL,
                onChainText TEXT,
                text TEXT,
                votes INT DEFAULT 0,
                onChainID INT,
                FOREIGN KEY (proposalID) REFERENCES proposals(id)
            )`,
            `CREATE TABLE IF NOT EXISTS votes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                proposalID INT NOT NULL,
                voterID INT NOT NULL,
                optionID INT NOT NULL,
                votes INT NOT NULL,
                claimedReward BOOLEAN DEFAULT FALSE,
                transactionID INT NOT NULL,
                FOREIGN KEY (proposalID) REFERENCES proposals(id),
                FOREIGN KEY (voterID) REFERENCES voters(id),
                FOREIGN KEY (optionID) REFERENCES options(id),
                FOREIGN KEY (transactionID) REFERENCES transactions(id)
            )`,
            `CREATE TABLE IF NOT EXISTS tnt20_deposits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                voterID INT NOT NULL,
                votingTokenID INT NOT NULL,
                amount DECIMAL(18, 8) NOT NULL,
                transactionID INT NOT NULL,
                UNIQUE (voterID, votingTokenID),
                FOREIGN KEY (voterID) REFERENCES voters(id),
                FOREIGN KEY (votingTokenID) REFERENCES tokens(id),
                FOREIGN KEY (transactionID) REFERENCES transactions(id)
            )`,
            `CREATE TABLE IF NOT EXISTS tnt721_deposits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tokenID INT NOT NULL,
                votingTokenID INT NOT NULL,
                voterID INT NOT NULL,
                transactionID INT NOT NULL,
                UNIQUE (tokenID, votingTokenID),
                FOREIGN KEY (votingTokenID) REFERENCES tokens(id),
                FOREIGN KEY (voterID) REFERENCES voters(id),
                FOREIGN KEY (transactionID) REFERENCES transactions(id)
            )`,
            `CREATE TABLE IF NOT EXISTS voting_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                proposalID INT NOT NULL,
                tokenID INT NOT NULL,
                votingPower INT NOT NULL,
                FOREIGN KEY (proposalID) REFERENCES proposals(id),
                FOREIGN KEY (tokenID) REFERENCES tokens(id)
            );`,
            `CREATE TABLE IF NOT EXISTS config (
                name VARCHAR(255) NOT NULL PRIMARY KEY,
                value INT NOT NULL,
                transactionID INT NOT NULL
            )`
        ];

        createTables.forEach((query) => {
            connection.query(query, (err, results) => {
                if (err) {
                    console.error('Error creating table:', err);
                    return;
                }
                console.log('Table created successfully.');
            });
        });

        configEntries.forEach((entry) => {
            const query = 'INSERT INTO config (name, value, transactionID) VALUES (?, ?, ?)';
            connection.query(query, [entry.name, entry.value, 0], (err, results) => {
                if (err) {
                    console.error('Error inserting config entry:', err);
                    return;
                }
                console.log(`Config entry ${entry.name} inserted successfully.`);
            });
        });

        connection.end();
    });
});