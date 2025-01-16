import { ThetaLog, ThetaTransaction } from "../ThetaProvider.js";
import ContractDefinition from './ContractDefinition.js';
import ContractEvent from './ContractEvent.js';

export default class SmartContract {

    readonly name: string;
    readonly address: string;

    public constructor(definition: ContractDefinition) {
        this.name = definition.name;
        this.address = definition.address;

        this.events = definition.events.map(ev => new ContractEvent(ev));
        for (const event of this.events) {
            const key = event.indexedTopics + event.topic;
            if (this.eventsByTopicAndIndexed[key]) {
                throw new Error(`There are two events with the same ABI: ${this.eventsByTopicAndIndexed[key].name} / ${event.name}`)
            }
            this.eventsByTopicAndIndexed[key] = event;
        }
    }

    protected eventsByTopicAndIndexed: { [x: string]: ContractEvent } = {};
    protected events: ContractEvent[] = [];

    // note locally which items we've already queried
    protected queriedItemIDs = new Set<number>();

    public logToEvent(log: ThetaLog, tx: ThetaTransaction) {
        const eventParser = this.eventsByTopicAndIndexed[log.topics.length + log.topics[0]];
        if (!eventParser) { // this log is not handable by this contract
            return null;
        }

        return eventParser.handle(log, tx);
    }

}