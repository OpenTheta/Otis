import Ajv, { ValidateFunction } from "ajv";
import { Express, NextFunction, Request, Response, Router } from 'express';
import path from 'path';
import * as tsj from 'ts-json-schema-generator';
import ServerError from "../helpers/ServerError.js";
import passport from "passport";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface RouteOptions {
    path?: string;
    post?: boolean;
    auth?: boolean;
}

const ajv = new Ajv({ coerceTypes: true });

const generator = tsj.createGenerator({
    path: path.join(__dirname, '../../src/server/routes/*.ts'),
    // tsconfig: path.join(__dirname, '../../tsconfig.json'),
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

export default function route(app: Router, routeAndFilename: string, handler: (query: any, req: Request) => any, options?: RouteOptions) {
    const interfaceName = capitalizeFirstLetter(routeAndFilename) + 'Query'; // e.g. "player" => "PlayerQuery"
    const queryValidator = createValidator(routeAndFilename, interfaceName);

    const path = options?.path ?? '/' + routeAndFilename;

    const handlerWrapper = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // await new Promise(resolve => setTimeout(resolve, 500)); // for debugging loading

            const query = (options?.post) ? req.body : req.query;
            const valid = queryValidator(query);
            if (!valid) {
                throw new ServerError(400, 'Invalid parameters', { reason: 'Invalid Parameters' });
            }

            const routeResult = await handler(query, req);
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
    };

    if (options?.post && options?.auth) {
        app.post(path, passport.authenticate('jwt', { session: false }), handlerWrapper);
    } else if (options?.post) {
        app.post(path, handlerWrapper);
    } else {
        app.get(path, handlerWrapper);
    }
}
