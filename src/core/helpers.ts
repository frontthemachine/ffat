import 'reflect-metadata';
import * as express from 'express';
import * as chalk from 'chalk';
import { ParamMetadataKey } from "./constants";
import { MalformedRequestBodyError } from "./errors";
import { log } from '../logger/log';

export function Param(name: string) {
    return (target: Object, propertyKey: string, parameterIndex: number) => {
        let params: UrlParam[] = Reflect.getOwnMetadata(ParamMetadataKey, target, propertyKey) || [];
        params.push(new UrlParam(parameterIndex, name));
        Reflect.defineMetadata(ParamMetadataKey, params, target, propertyKey);
    }
}

export function ParseBody(params: UrlParam[], req: express.Request, res: express.Response): any[] {
    let targetParams = [];
    if (params.length > 0) {
        const body = req.body;
        //check body
        if (!body || Object.keys(body).length < 1) {
            //no body detected
            let error = new MalformedRequestBodyError('request body is missing');
            res.status(400);

            //logging the error on the server
            log('received \'%s\' request for \'%s\' from \'%s\': status %s: %s',
                chalk.green('GET'),
                chalk.green(req.url),
                chalk.green(req.ip),
                chalk.red((400).toString()),
                error.message);

            //sending back an error
            res.setHeader('Content-Type', 'application/json');
            res.send(error);
            res.end();
            return null;
        }

        //gathering parameters
        for (let i = 0; i < params.length; i++) {
            const gathered = req.body[params[i].name];
            if (!gathered) {
                //requested parameter not found
                let error = new MalformedRequestBodyError('missing parameter \'' + params[i].name + '\'');
                res.status(400);

                //log the error to the server
                log('received \'%s\' request for \'%s\' from \'%s\': status %s: %s',
                    chalk.green('GET'),
                    chalk.green(req.url),
                    chalk.green(req.ip),
                    chalk.red((400).toString()),
                    error.message);

                //sending back the error
                res.setHeader('Content-Type', 'application/json');
                res.send(error);
                res.end();
                return null;
            }

            //if here, target parameter has been found in the request body
            targetParams[params[i].index] = gathered;
        }
    }
    return targetParams;
}

export class UrlParam {
    constructor(index: number, name: string) {
        this.index = index;
        this.name = name;
    }
    index: number;
    name: string;
}