

export default class ServerError extends Error {
    public status: number;
    public url?: string;

    constructor(code: number, message: string, readonly publicInfo: object = {}) {
        super(message);
        this.status = code;
    }
}
