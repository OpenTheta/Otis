import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';

import 'express-async-errors';
import setupPassport from "./auth/setupPassport.js";
import path from 'path';
import logger from '../helpers/logger.js';
import route from "./route.js";
import testRoute from "./routes/testRoute.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import proposerInfoRoute from "./routes/proposerInfo.js";
import accessCheckRoute from "./routes/accessCheck.js";
import updateProposalRoute from "./routes/updateProposal.js";
import allProposalsRoute from "./routes/allProposals.js";
import adminRoute from "./admin/adminRoute.js";
import adminSettingsRoute from "./admin/routes/settings.js";
import adminSetTokenNameRoute from "./admin/routes/setTokenName.js";
import adminUpdateProposalRoute from "./admin/routes/updateProposal.js";

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function server() {

    const app = express();

    app.disable('x-powered-by'); // disables header "X-Powered-By: Express"
    app.set('trust proxy', 1); // trust nginx reverse proxy

    const origins = (process.env.CORS_ORIGIN as string).split(',').map(e => {
        if (!e.startsWith('*.')) {
            return e;
        }
        // allow subdomain wildcard
        const regexString = e.slice(1).replace(/\./g, '\\.') + '$';
        const regex = new RegExp(regexString);
        return regex;
    });
    app.use(cors({
        origin: origins,
        maxAge: 7200, // 7200 -> 2 hours (maximum in Chrome)
        credentials: true, // sets header "Access-Control-Allow-Credentials"
        // exposedHeaders: ['date'],
    }));

    // for auth
    app.use(express.json());
    app.use(express.urlencoded({ extended: true })); // not sure if this is really needed

    const BLOCKED_IPS = JSON.parse(process.env.BLOCKED_IPS ?? '[]') as string[];
    const LIMITED_IPS = JSON.parse(process.env.LIMITED_IPS ?? '[]') as string[];
    const LIMITED_USER_AGENTS = JSON.parse(process.env.LIMITED_USER_AGENTS ?? '[]') as string[];

    const blockedIps = new Set(BLOCKED_IPS);
    const limitedIps = new Set(LIMITED_IPS);
    const limitedUserAgents = new Set(LIMITED_USER_AGENTS);

    app.use((req, res, next) => { // makes it easy to filter in DevTools (has-response-header:X-OT)
        res.set('X-OT', '1.0');

        let ipAddress = req.headers['cf-connecting-ip'] ?? req.headers['x-real-ip'] ?? req.socket.remoteAddress ?? '-';
        const userAgent = req.headers['user-agent'] ?? '-';
        if (typeof ipAddress === 'string' && (limitedIps.has(ipAddress) && limitedUserAgents.has(userAgent) || blockedIps.has(ipAddress))) {
            if (blockedIps.has(ipAddress)) {
                res.status(403);
                res.end();
            } else {
                res.status(400);
                res.json({ error: true, description: 'Supply a recognizable user-agent that contains a name and contact information. Further violations may lead to an IP block.' });
            }
        } else {
            next();
        }
    });

    // set up `/login-nonce` and `/login`
    setupPassport(app);

    app.get('/', (req, res) => {
        res.json({ message: 'Hello Oties!' });
    });

    // ------------------------------- ROUTES START -------------------------------
    route(app, 'test', testRoute);
    route(app, 'accessCheck', accessCheckRoute, { post: true, auth: false });
    route(app, 'proposerInfo', proposerInfoRoute, { post: true, auth: true });
    route(app, 'updateProposal', updateProposalRoute, { post: true, auth: true });
    route(app, 'allProposals', allProposalsRoute);
    // route(app, 'couponCreate', couponCreateRoute, { post: true, auth: true });
    // route(app, 'couponRedeem', couponRedeemRoute, { post: true });


    // ------------------------------- ADMIN ROUTES -------------------------------
    adminRoute(app, 'settings', adminSettingsRoute);
    adminRoute(app, 'setTokenName', adminSetTokenNameRoute);
    adminRoute(app, 'updateProposal', adminUpdateProposalRoute);
    // adminRoute(app, 'projects', adminProjectsRoute);

    // -------------------------------- ROUTES END --------------------------------

    app.all('*', function (req, res, next) {
        res.status(404).json({ error: true, notFound: true });
    });

    app.use(function errorHandler(err: Error, req, res, next) {
        logger.error('Internal Server Error', { error: err?.message, stack: err?.stack, url: req.url });
        res.status(500).json({ error: true });
    } as ErrorRequestHandler);

    return new Promise<void>((resolve) => {
        app.listen(4001, '127.0.0.1', () => {
            logger.info('Webserver started');
            resolve();
        });
    });
};
