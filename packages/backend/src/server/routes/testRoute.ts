export interface TestQuery {
    ping: number;
    pw: 'only-with-the-right-pw-hahahah123';
}

export interface TestData {
    pong: number;
    random: number;
    time: string;
    headers: any;
}

export default async function testRoute(query: TestQuery, req: any): Promise<TestData> {
    return {
        pong: query.ping,
        random: Math.random(),
        time: (new Date()).toISOString(),
        headers: req.headers,
    }
}