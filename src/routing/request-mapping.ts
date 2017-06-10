import 'reflect-metadata';
import * as express from 'express';
import * as Core from '../core/core';
import * as chalk from "chalk";
import { log, warn, error, info } from "../logger/log";
import { Endpoint } from "../mapping/endpoint";
import { AuthConfig, ExecutionContext, CredProvider } from "../security/authentication-manager";
import { User } from "../security/user";
import { ParamMetadataKey } from "../core/constants";
import { UrlParam, ParseBody } from "../core/helpers";
import { TokenInvalidError, ForbiddenError, AuthenticationRequiredError, NotImplementedError } from "../core/errors";




export function Get(url: string, roles?: string[]) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        // checking if descriptor exists
        if (descriptor === undefined) {
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        }

        // getting param list
        let params: UrlParam[] = Reflect.getOwnMetadata(ParamMetadataKey, target, propertyKey) || [];

        // saving old function
        const old = descriptor.value as Function;

        // decorating function
        descriptor.value = decorate(old, url, params, roles);

        // adding to the Mapping list
        Core.AddEndpoint(new Endpoint(url, 'GET', descriptor.value, roles));
    };
}

export function Post(url: string, roles?: string[]) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        // checking if descriptor exists
        if (descriptor === undefined) {
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        }

        // getting param list
        let params: UrlParam[] = Reflect.getOwnMetadata(ParamMetadataKey, target, propertyKey) || [];

        // saving old function
        const old = descriptor.value as Function;

        // decorating function
        descriptor.value = decorate(old, url, params, roles);

        // adding to the Mapping list
        Core.AddEndpoint(new Endpoint(url, 'POST', descriptor.value, roles));
    };
}

export function Put(url: string, roles?: string[]) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        // checking if descriptor exists
        if (descriptor === undefined) {
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        }

        // getting param list
        let params: UrlParam[] = Reflect.getOwnMetadata(ParamMetadataKey, target, propertyKey) || [];

        // saving old function
        const old = descriptor.value as Function;

        // decorating function
        descriptor.value = decorate(old, url, params, roles);

        // adding to the Mapping list
        Core.AddEndpoint(new Endpoint(url, 'PUT', descriptor.value, roles));
    };
}

export function Patch(url: string, roles?: string[]) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        // checking if descriptor exists
        if (descriptor === undefined) {
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        }

        // getting param list
        let params: UrlParam[] = Reflect.getOwnMetadata(ParamMetadataKey, target, propertyKey) || [];

        // saving old function
        const old = descriptor.value as Function;

        // decorating function
        descriptor.value = decorate(old, url, params, roles);

        // adding to the Mapping list
        Core.AddEndpoint(new Endpoint(url, 'PATCH', descriptor.value, roles));
    };
}

export function Delete(url: string, roles?: string[]) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        // checking if descriptor exists
        if (descriptor === undefined) {
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        }

        // getting param list
        let params: UrlParam[] = Reflect.getOwnMetadata(ParamMetadataKey, target, propertyKey) || [];

        // saving old function
        const old = descriptor.value as Function;

        // decorating function
        descriptor.value = decorate(old, url, params, roles);

        // adding to the Mapping list
        Core.AddEndpoint(new Endpoint(url, 'DELETE', descriptor.value, roles));
    };
}

function decorate(old: Function, url: string, params: UrlParam[], roles?: string[]):
    (req: express.Request, res: express.Response, next?: express.NextFunction) => void {

    return function (req: express.Request, res: express.Response, next?: express.NextFunction) {
        //preparing Context
        let context = new ExecutionContext(req, res, next);
        if (AuthConfig.Enabled) {
            // check for token only if the security is enabled
            // getting current user (if present)
            const token = decodeURIComponent(req.cookies[AuthConfig.SessionCookieName]);
            if (token !== null) {
                // there is a session, let's get the user
                if (!CredProvider) {
                    throw new NotImplementedError('Security needs the @CredentialProvider to be implemented in order to provide User instances to the Execution Context.');
                }
                let user = CredProvider(token);
                console.log(user);
                if (user instanceof Error) {
                    // check if security is required
                    if (roles && roles.length > 0) {
                        // token non valid or session expired
                        const error = new TokenInvalidError('cannot authenticate becouse the supplied token is not valid.');

                        sendErrorToClient(req, res, 401, error);
                        return;
                    }
                    // if user is unvalid but security isn't required nothing's bad
                }
                // if user is found
                user = user as User;
                // check user's permissions
                if (roles && roles.length > 0) {
                    // secured and user found
                    for (let i = 0; i < roles.length; i++) {
                        if (user.Roles.indexOf(roles[i]) !== -1) {
                            // user has the permissions
                            context.user = user;
                            break;
                        }
                    }
                    if (!context.user) {
                        // user don't have enough permissions
                        // return 403
                        const error = new ForbiddenError('Forbidden, you don\'t have enough permissions.');

                        // logging
                        sendErrorToClient(req, res, 403, error);
                        return;
                    }
                }

                // user found and no permission required

                context.user = user;
            } else if (roles && roles.length > 0) {
                // secured and no token
                const error = new AuthenticationRequiredError('the server rejected your request.');
                sendErrorToClient(req, res, 401, error);
                return;
            }
        }
        

        // finally everything's ok

        // checking body integrity
        const targetParams = ParseBody(params, req, res);
        if (targetParams === null) {
            // an error has occurred;
            return;
        }

        // now we have all the parameters correctly loaded (if present)

        // logging the request
        log('received \'%s\' request for \'%s\' from \'%s\': status %s', chalk.green(req.method), chalk.green(req.url), chalk.green(req.ip), 200);

        let ctxPos = Infinity;
        // calculating the first arg not decorated
        let maxI = 0;
        params.sort((a, b) => (a.index > b.index ? 1 : a.index === b.index ? 0 : -1));
        for (let i = 0; i < params.length; i++) {
            if (params[i].index !== i) {
                // found a hole
                ctxPos = i;
                break;
            }
        }
        if (ctxPos > params.length - 1) {
            //no holes
            ctxPos = params.length
        }
        targetParams[ctxPos] = context;

        // applying the old function
        res.send(old.apply(this, targetParams));
        res.end();
    }

};

function sendErrorToClient(req: express.Request, res: express.Response, errorCode: number, error: Error) {
    log('received \'%s\' request for \'%s\' from \'%s\': status %s: %s',
        chalk.green(req.method),
        chalk.green(req.url),
        chalk.green(req.ip),
        chalk.red((errorCode).toString()),
        error.message);

    // sending the error to the client
    res.status(errorCode);
    res.setHeader('Content-Type', 'application/json');
    res.send(error);
    res.end();
}
