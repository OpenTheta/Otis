import jwt from 'jsonwebtoken';

import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

const SECRET = process.env.JWT_SECRET as string;

const JWT_STRATEGY_OPTIONS: any = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: SECRET,
}

export interface ClientUserInfo {
    token: string;
}

export interface ServerUserInfo {
    address: string;
}

export function jwtAuthenticate(user: ServerUserInfo): ClientUserInfo {
    const { address } = user;
    const tokenPayload: ServerUserInfo = { address };
    const token = jwt.sign(tokenPayload, SECRET, { algorithm: 'HS256', expiresIn: '25h' }); // 1h buffer for the client
    return { token };
}

export default () => new JwtStrategy(JWT_STRATEGY_OPTIONS, async (payload: ServerUserInfo, done: any) => {
    if (!payload || typeof payload.address !== 'string') {
        return done(null, false);
    }
    const { address } = payload;
    done(null, { address } as ServerUserInfo);
});