
import jwt from 'jsonwebtoken';

interface ClientUserInfo {
    token: string;
}

export function setUser(user: ClientUserInfo) {
    localStorage.setItem('user', JSON.stringify(user));
}

const EXPIRE_BUFFER = 60 * 60 * 1000; // 1 hour

interface TokenPayload {
    address: string;
    exp: number;
    iat: number;
}

export function getUser() {
    if (typeof window === 'undefined') {
        return;
    }
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        return;
    }
    const tokenData = JSON.parse(userStr) as { token: string };
    const token = jwt.decode(tokenData.token) as (TokenPayload | null);
    if (!token || !token.exp) {
        return;
    }
    if (Date.now() >= (token.exp * 1000 - EXPIRE_BUFFER)) {
        logout(); // also remove token from localstorage
        return;
    }
    return {
        token: tokenData.token,
        address: token.address,
    };
}

export function logout() { // on the client
    localStorage.removeItem('user');
}
