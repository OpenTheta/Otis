import Ajv, { ValidateFunction } from "ajv";
import { Express, NextFunction, Request, Response } from 'express';
import passport from "passport";
import path from 'path';
import * as tsj from 'ts-json-schema-generator';
import DbAddress from "../../database/api/DbAddress.js";
import ServerError from "../../helpers/ServerError.js";
import { ServerUserInfo } from "../auth/strategyJwt.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ajv = new Ajv({ coerceTypes: true });

const generator = tsj.createGenerator({
    path: path.join(__dirname, '../../../src/server/admin/routes/*.ts'),
    tsconfig: path.join(__dirname, '../../../tsconfig.json'),
    // type: '*',
    skipTypeCheck: true,
    jsDoc: 'none',
    additionalProperties: true,
});
const schemaCollection = generator.createSchema('*');

const createValidator = function createValidator(routeAndFilename: string, interfaceName: string): ValidateFunction {
    const schema = schemaCollection.definitions?.[interfaceName];
    if (!schema) {
        throw new Error('Unable to parse schema: ' + routeAndFilename + ' | ' + interfaceName);
    }
    // (schema as any).additionalProperties = true;
    return ajv.compile(schema);
}

const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.substr(1);

const adminAddresses = (process.env.ADMIN_WALLETS as string).split(',').map(adr => adr.toLowerCase());

export default function adminRoute(app: Express, routeAndFilename: string, handler: (query: any) => any) {
    const capitalized = capitalizeFirstLetter(routeAndFilename);
    const interfaceName = `Admin${capitalized}Query`; // e.g. "projects" => "AdminProjectsQuery"
    const queryValidator = createValidator(routeAndFilename, interfaceName);

    app.post('/admin/' + routeAndFilename, passport.authenticate('jwt', { session: false }), async (req: Request, res: Response, next: NextFunction) => {
        try {
            // await new Promise(resolve => setTimeout(resolve, 500)); // for debugging loading

            const address = (req.user as ServerUserInfo)?.address;
            if (!address || !adminAddresses.includes(address)) {
                throw new ServerError(401, 'Unauthorized');
            }
            const query = req.body;
            const valid = queryValidator(query);
            if (!valid) {
                throw new ServerError(400, 'Invalid parameters', { reason: 'Invalid Parameters' });
            }

            const routeResult = await handler(query);
            res.json(routeResult);
        } catch (error: any) {
            if (error.status && error.status >= 400 && error.status < 500) { // check if it's a user error
                res.status(error.status).json({
                    error: true,
                    ...error.publicInfo,
                });
                return;
            } else {
                next(error);
            }
        }
    });
}
