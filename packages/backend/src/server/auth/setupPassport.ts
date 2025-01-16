import { Express, Request, Response } from 'express';
import passport from 'passport';
import cookieSessionImp from 'cookie-session';
// import strategyJwt from './strategyJwt';
import MetamaskStrategy from './MetamaskStrategy.js';
import strategyJwt, { jwtAuthenticate, ServerUserInfo } from './strategyJwt.js';
import {Session} from "express-session";

const cookieSettings: CookieSessionInterfaces.CookieSessionOptions = {
    name: 'session',
    keys: ['kLDFqE5RsPWdU2n_3bJ9MeT8j-G6YcZK'],
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: false,
    path: '/',
};
if (process.env.NODE_ENV === 'production') {
    cookieSettings.sameSite = 'none';
    cookieSettings.secure = true;
}

const cookieSession = cookieSessionImp(cookieSettings);

export default function setupPassport(app: Express) {
    app.use(passport.initialize());
    // internal jwts
    passport.use(strategyJwt());

    // login providers
    passport.use(new MetamaskStrategy());

    // this route only generates the random nonce for the user (and stores it via cookie-session)
    app.get(
        '/login-nonce',
        cookieSession,
        passport.authenticate('metamask',
            { session: false, generateNonce: true } as any),
        async (req: Request & { session: Session & { nonce?: string} }, res: Response) => {
            res.json({ nonce: req.session?.nonce });
        },
    );

    // and this route expects the actual signed message with the random nonce (read from the session)
    app.post(
        '/login',
        cookieSession,
        passport.authenticate('metamask', { session: false } as any),
        (req, res, next) => {
            const user = req.user as ServerUserInfo | undefined;
            if (!user || !user.address) {
                return next(new Error('Authentication failed, missing user'));
            }
            return res.json(jwtAuthenticate(user));
        },
    );
};
