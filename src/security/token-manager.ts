import { AuthConfig } from "./authentication-manager";
import * as jwt from 'jsonwebtoken';
import { error } from '../logger/log';
import { Request, Response } from 'express';
import { UnknownJWTMethodError } from "../core/errors";


export namespace TokenManager {
    export function CreateToken(data: Object): string {
        const token = jwt.sign(
            data,
            AuthConfig.SecretKey,
            {
                expiresIn: AuthConfig.TokenTTL,
                algorithm: AuthConfig.CryptoAlghoritm
            }
        );
        return token;
    }

    export function SendToken(token: string, req: Request, res: Response) {
        switch (AuthConfig.JWTMethod) {
            case 'use-Cookies':
                res.cookie(AuthConfig.SessionCookieName, token, { maxAge: AuthConfig.TokenTTL, httpOnly: true });
                break;
            default:
                res.status(500);
                res.send(new UnknownJWTMethodError('unknown JWT method \'' + AuthConfig.JWTMethod + '\''));
                res.end();
                return;
        }
    }
}

export function ValidateToken(token: string): Object | Error {
    try {
        const payload = jwt.verify(token, AuthConfig.SecretKey);

        return payload;
    } catch (error) {
        // delegate error 
        return error;
    }
}