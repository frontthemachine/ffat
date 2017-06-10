import * as express from 'express';

export class Endpoint {
    constructor(
        url: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        handler: (req: express.Request, res: express.Response, next?: express.NextFunction) => void,
        roles?: string[]
    ) {
        this.url = url;
        this.method = method;
        this.handler = handler;
        if (roles) {
            this.roles = roles;
        }
    }
    public url: string;
    public method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    public handler: (req: express.Request, res: express.Response, next?: express.NextFunction) => void;
    public roles?: string[];
}