import axios from "axios";
import { ethers } from "ethers";

export enum ThetaBlockStatus {
    pending  = 0,
    valid = 1,
    invalid = 2,
    committed = 3,
    directly_finalized = 4,
    indirectly_finalized = 5,
    trusted = 6,
}

export enum ThetaTransactionType {
    coinbase = 0,
    slash = 1,
    send = 2,
    reserve_fund = 3,
    release_fund = 4,
    service_payment = 5,
    split_rule = 6,
    smart_contract = 7,
    deposit_stake = 8,
    withdraw_stake = 9,
}

interface ThetaTransactionOthersRaw {
    type: ThetaTransactionType.coinbase | ThetaTransactionType.slash;
}

interface ThetaTransactionContractRaw {
    raw: {
        from: {
            address: string;
            coins: {
                thetawei: string;
                tfuelwei: string;
            },
            sequence: string;
            signature: string;
        },
        to: {
            address: string;
            coins: {
                thetawei: string;
                tfuelwei: string;
            }
        },
        gas_limit: string;
        gas_price: string;
        data: string;
    },
    type: ThetaTransactionType.smart_contract;
    hash: string;
    receipt: {
        TxHash: string;
        Logs: Array<ThetaLog>,
        ContractAddress: string;
        GasUsed: number;
    }
}

interface ThetaRawReponse {
    height: string;
    timestamp: string;
    proposer: string;
    status: ThetaBlockStatus;
    hash: string;
    transactions: Array<ThetaTransactionContractRaw | ThetaTransactionOthersRaw>;
}

export interface ThetaLog {
    address: string;
    topics: string[];
    data: string;
    logIndex: number;
}

export interface ThetaTransaction {
    from: {
        address: string;
        tfuel: string;
    },
    to: {
        address: string;
        tfuel: string;
    },
    data: string;
    gasLimit: string;
    gasPrice: string;
    type: ThetaTransactionType;
    hash: string;
    gasUsed: string;
    contractAddress: string;
    logs: ThetaLog[];
}

export interface ThetaBlock {
    blockHeight: number;
    hash: string;
    timestamp: number;
    transactions: ThetaTransaction[],
}

export default class ThetaProvider extends ethers.FallbackProvider {

    private thetaBridgeProvider: ethers.JsonRpcProvider;
    private thetaBridgeProviderFallback: ethers.JsonRpcProvider;

    public constructor(ethRPCs: string[], thetaRPCs: string[]) {
        if (ethRPCs.length == 0) {
            throw new Error("No Eth RPC provided");
        }
        if (thetaRPCs.length != 2) {
            throw new Error("Not exactly two Theta RPCs provided");
        }

        // const network = new ethers.Network('Theta Mainnet', 361);
        //
        // let option: ethers.JsonRpcApiProviderOptions = {
        //     batchMaxCount: 1,
        //     staticNetwork: network,
        // };

        const providers = ethRPCs.map((rpc, index) => ({
            provider: new ethers.JsonRpcProvider(rpc),
            priority: index + 1,
            weight: 1,
            stallTimeout: 2000
        }));


        super(providers);


        this.thetaBridgeProvider = new ethers.JsonRpcProvider(thetaRPCs[0]);
        this.thetaBridgeProviderFallback = new ethers.JsonRpcProvider(thetaRPCs[1]);
    }

    public async getBlockWithContractTransactions(blockHeight: number): Promise<ThetaBlock> {
        let data: ThetaRawReponse;
        try {
            data = await this.thetaBridgeProvider.send('theta.GetBlockByHeight', [{
                height: blockHeight.toString(),
            }]);
            if (!data.height) {
                data = await this.thetaBridgeProviderFallback.send('theta.GetBlockByHeight', [{
                    height: blockHeight.toString(),
                }]);
            }
        } catch {
            console.log("Error ThetaProvider with blockHeight: ", blockHeight);
            throw new Error(`Block ${blockHeight} is out of range of valid blocks (8287154-CURRENT)`);
        }

        if (!data.height) {
            throw new Error(`Block ${blockHeight} is out of range of valid blocks (8287154-CURRENT)`);
        }

        const block: ThetaBlock = {
            blockHeight: parseInt(data.height, 10),
            hash: data.hash,
            timestamp: parseInt(data.timestamp, 10),
            transactions: [],
        }
        if (data.transactions) {
            for (let tx of data.transactions) {
                if (tx.type !== ThetaTransactionType.smart_contract) {
                    continue;
                }
                block.transactions.push({
                    from: {
                        address: tx.raw.from.address,
                        tfuel: tx.raw.from.coins.tfuelwei,
                    },
                    to: {
                        address: tx.raw.to.address,
                        tfuel: tx.raw.to.coins.tfuelwei,
                    },
                    data: tx.raw.data,
                    gasLimit: tx.raw.gas_limit,
                    gasPrice: tx.raw.gas_price,
                    type: ThetaTransactionType.smart_contract,
                    hash: tx.hash,
                    gasUsed: tx.receipt.GasUsed.toString(),
                    contractAddress: tx.receipt.ContractAddress,
                    logs: tx.receipt.Logs.map((log, i) => ({
                        address: log.address,
                        logIndex: i,
                        topics: log.topics,
                        data: '0x' + Buffer.from(log.data, 'base64').toString('hex'),
                    })),
                });
            }
        }
        return block;
    }

    public async queryTfuelPriceUSD(): Promise<number> {
        const { data } = await axios.get<{
            body: Array<{ _id: string; price: number; }>
        }>('https://explorer-api.thetatoken.org/api/price/all', { timeout: 30_000 });
        for (const priceInfo of data.body) {
            if (priceInfo._id === 'TFUEL') {
                return priceInfo.price;
            }
        }
        throw new Error('Unable to find TFUEL info in price data.');
    }
}