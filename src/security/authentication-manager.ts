import { User } from './user';
import * as jwt from 'jsonwebtoken';
import * as express from 'express';
import { log, error, warn, info } from '../logger/log';
import * as chalk from 'chalk';
import { TokenManager, ValidateToken } from './token-manager';
import { AddEndpoint } from '../core/core';
import { Endpoint } from "../mapping/endpoint";
import { UrlParam, ParseBody } from "../core/helpers";
import { ParamMetadataKey } from "../core/constants";
import { UnknownJWTMethodError, NotImplementedError } from "../core/errors";

export let AuthProvider: (...args: any[]) => Object | Error;
export let CredProvider: (token: string) => User | Error;

let loginParams: UrlParam[];

export namespace AuthenticationManager {
    export function Config() {
        return new AuthConfig();
    }
}

export function CredentialProvider() {
    // the credential provider is responsible for
    // returning an user given a valid token.
    // the middleware have to do the token validation
    // and pass the encripted data to the decorate function
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // checking if descriptor exists
        if (descriptor === undefined) {
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        }

        let old = descriptor.value as (data: Object) => User | Error;

        descriptor.value = function (token: string) {
            // validate the token
            let data = ValidateToken(token);
            if (data instanceof Error) {
                // token is not valid, return the error
                return data;
            }

            // call the decorated function
            return old.apply(this, data);
        }
        CredProvider = descriptor.value;
    }
}

export function AuthenticationProvider() {
    // decorate the functino responsible to get the data from the login request 
    // and turn them into an auth token. 
    // The token is intercepted and inserted in the headers

    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // checking if descriptor exists
        if (descriptor === undefined) {
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        }
        // saving the target function
        let old = descriptor.value as (...args: any[]) => string | Error;
        loginParams = Reflect.getOwnMetadata(ParamMetadataKey, target, propertyKey) || [];


        descriptor.value = function (req: express.Request, res: express.Response, ...args: any[]) {
            // this function is called only from the middleware
            // unless the user want to break things
            // so just get the token
            let token = old.apply(this, args);

            if (typeof token === 'string') {
                // put it into the headers
                putTokenIntoHeaders(res, token);
            }
            // return it (if it's an Error, just return it)
            return token;

        }
        AuthProvider = descriptor.value;
    }
}

export function LoginSuccessHandler(path: string) {
    // map the login, if it's successfull
    // creates the token and set it to the res
    // return the req/res and the logged user to the decorated function
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // checking if descriptor exists
        if (descriptor === undefined) {
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        }
        // saving the decorated function
        const old = descriptor.value;
        // replacing it
        descriptor.value = function (req: express.Request, res: express.Response, next?: express.NextFunction) {
            let isError = false;
            let user;
            // getting the parameters for the AuthProvider
            // NOTE: if the AuthProvider requires 0 parameters, it should work..
            let params: UrlParam[] = loginParams;
            if (params.length < 1) {
                throw new NotImplementedError('the @AuthenticationProvider requires no parameters, \
                    did you miss to decorate them with @Param()?');
            }
            let AuthProviderParams = ParseBody(params, req, res);

            // if everything worked, now we have the target parameters (if supplied from the call)
            if (!AuthProvider) {
                // auth provider has not been configured yet, throw the error
                throw new NotImplementedError('the @AuthenticationProvider() has not been configured yet,\
                     be sure to put it before the @LoginSuccessHandler() \
                     and after the @CredentialProvider()');
            }

            // preparing the logging
            let status = 200;

            if (AuthProviderParams === null) {
                // error, no paramters provided
                // at this point, ParseBody will have already sent the error so that
                // sending others error will turn into internal error
                return;
            }


            let tokenData = AuthProvider.apply(this, [req, res].concat(AuthProviderParams));

            if (tokenData instanceof Error) {
                // unvalid credentials
                status = 401;
                res.setHeader('Content-Type', 'application/json');
                res.status(status);
                res.send(tokenData);
                res.end();
                isError = true;
            }

            if (!isError) {
                // now we should have the data for the token
                if (!CredProvider) {
                    throw new NotImplementedError(`
                    the @CredentialProvider() has not been configured yet, 
                    be sure to put it before the @AuthenticationProvider() 
                    and the @LoginSuccessHandler()`);
                }

                //creating the token and saving into the headers
                let token = TokenManager.CreateToken(tokenData);
                TokenManager.SendToken(token, req, res);

                user = CredProvider(token);


                if (!('Username' in user)) {
                    // Errors don't have the 'username' field :D
                    status = 401;
                    res.setHeader('Content-Type', 'application/json');
                    res.status(status);
                    res.send(user);
                    res.end();
                    isError = true;
                }
            }

            log('received \'%s\' request for \'%s\' from \'%s\': status %s', chalk.green(req.method), chalk.green(req.url), chalk.green(req.ip), status);

            if (isError) {
                // no successfull login if we sent errors
                return;
            }

            // and finally we logged in correctly! let's return the context to the proper function
            old.apply(this, [req, res, user]);

        }
        // track the login endpoint
        AddEndpoint(new Endpoint(path, 'POST', descriptor.value));
    }
}

function putTokenIntoHeaders(res: express.Response, token: string) {
    switch (AuthConfig.JWTMethod) {
        case 'use-Cookies':
            // each time the user makes a request, the cookie ttl is reset
            res.cookie(AuthConfig.SessionCookieName, token, { maxAge: AuthConfig.TokenTTL, httpOnly: true });
            break;
        default:
            // unknown method or not yet supported
            throw new UnknownJWTMethodError('unknown JWT method \'' + AuthConfig.JWTMethod + '\'');
    }
}

export class AuthConfig {
    public static TokenTTL: number = 60 * 60;
    public static SecretKey: string;
    public static Enabled: boolean = false;
    public static CryptoAlghoritm = 'HS256';
    public static LogoutEntryPoint = '/logout';
    public static JWTMethod = 'use-Cookies';
    public static SessionCookieName = 'ffatSession';

    public static LoginAuthenticationHandler: ((req: express.Request, res: express.Response, next?: express.NextFunction) => void);

    public Enable(value?: boolean) {
        if (value) {
            AuthConfig.Enabled = value;
        } else {
            AuthConfig.Enabled = true;
        }
        return this;
    }
    public SetTokenTTL(seconds: number) {
        if (seconds > 0) {
            AuthConfig.TokenTTL = seconds;
        }
        return this;
    }
    public SetAlghoritm(alg: 'HS256' | 'HS384' | 'HS512' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512' | 'none') {
        AuthConfig.CryptoAlghoritm = alg;
        return this;
    }
    public SetKey(key: string) {
        if (key.length > 0) {
            AuthConfig.SecretKey = key;
        }
        return this;
    }
    public SetLogoutEntryPoint(url: string) {
        AuthConfig.LogoutEntryPoint = url;
        return this;
    }
    public SetJWTMethod(method: 'use-Cookies' | 'use-Headers' | 'use-ResponseBody') {
        AuthConfig.JWTMethod = method;
        return this;
    }
    public SetSessionCookieName(name: string) {
        AuthConfig.SessionCookieName = name;
        return this;
    }

}



export class ExecutionContext {
    constructor(req: express.Request, res: express.Response, next: express.NextFunction) {
        this.request = req;
        this.response = res;
        this.nextFunction = next;
        this.user = null;
    }
    request: express.Request;
    response: express.Response;
    nextFunction: express.NextFunction;
    user: User;
}
