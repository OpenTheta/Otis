import { ethers, AbiCoder } from "ethers";
import { ThetaLog, ThetaTransaction } from "../ThetaProvider.js";
import { AbiEvent, AbiEventParameter, ContractEventHandler, LogEvent } from "./ContractDefinition.js";

export default class ContractEvent {
    // from ABI
    readonly functionHead: string;
    readonly topic: string;
    readonly name: string;
    readonly indexedTopics: number;

    private topicFields: AbiEventParameter[];
    private dataFields: AbiEventParameter[];

    private handler: ContractEventHandler;

    constructor(abiEvent: AbiEvent) {
        this.name = abiEvent.name;
        this.functionHead = `${abiEvent.name}(${abiEvent.inputs.map(inp => inp.type).join(',')})`
        this.topicFields = abiEvent.inputs.filter(a => a.indexed);
        this.indexedTopics = this.topicFields.length + 1;
        this.dataFields = abiEvent.inputs.filter(a => !a.indexed);
        this.topic = ethers.id(this.functionHead);
        this.handler = abiEvent.handler;
    }

    public parse(log: { topics: string[]; data: string }) {
        // the ABI signature is the same, but the number if indexes is different -> so this is actually not the event we are looking for
        if (log.topics.length !== this.topicFields.length + 1) {
            return null;
        }
        const abiCoder = new AbiCoder();

        const data: { [key: string]: any } = {};

        if (this.dataFields.length !== 0) {
            const decodeTypes = this.dataFields.map(f => f.type);
            const dataResult = abiCoder.decode(decodeTypes, log.data);
            // store results in data
            this.dataFields.forEach((f, i) => data[f.name] = dataResult[i]);
        }

        for (const [i, field] of this.topicFields.entries()) {
            data[field.name] = abiCoder.decode([field.type], log.topics[i + 1])[0];
        }
        return data;
    }

    public handle(log: ThetaLog, tx: ThetaTransaction): LogEvent|null {
        const data = this.parse(log);
        if (!data) {
            return null;
        }
        const logEvent = this.handler(data, log, tx);
        if (!logEvent) {
            return null;
        }
        return logEvent;
    }

}
