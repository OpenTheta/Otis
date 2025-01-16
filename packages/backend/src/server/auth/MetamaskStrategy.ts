import { ethers } from 'ethers';
import { Request } from 'express';
import { customAlphabet } from 'nanoid';
import { Strategy } from 'passport-strategy';
import {Session} from "express-session";

const nanoid10 = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 20);

const generateMessage = (address: string, nonce: string) => `Press "Sign" to authenticate on OpenTheta.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address:\n${address.toLowerCase()}\n\nRandom nonce for validation:\n${nonce}`;

export default class MetamaskStrategy extends Strategy {
    constructor() {
        super();
        (this as any).name = 'metamask';
    }

    async authenticate(req: Request & { session: Session & { nonce?: string, nonceAge?: number } }, options: any) {
        if (!req.session) {
            return this.error(new Error('req.session is unavailable.'));
        }

        // First mode: Generate nonce for the user
        if (options.generateNonce) { // return nonce
            const nonce = nanoid10(); // random nonce
            req.session.nonce = nonce;
            req.session.nonceAge = Date.now();
            return this.pass();
        }

        // Second mode: Verify the request from the user
        const signature = req.body.signature;
        const address = req.body.address;
        const nonce = req.session?.nonce;
        if (typeof signature !== 'string' || typeof address !== 'string') {
            return this.error(new Error('Missing signature or address'));
        } else if (typeof nonce !== 'string' || !req.session.nonceAge) {
            return this.error(new Error('Missing generated nonce'));
        } else if (req.session.nonceAge + 60 * 60 * 1000 < Date.now()) {
            return this.error(new Error('Outdated generated nonce'));
        }
        try {
            const message = generateMessage(address, nonce);
            const signedAddress = ethers.verifyMessage(message, signature);
            if (signedAddress.toLowerCase() !== address.toLowerCase()) {
                return this.error(new Error('Invalid address'));
            }
            req.session.nonce = undefined; // reset nonce
    
            this.success({ address: signedAddress.toLowerCase() });
        } catch (err: any) {
            this.error(err);
        }
    }
}

