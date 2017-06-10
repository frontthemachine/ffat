import { error } from '../logger/log';

export class MalformedRequestBodyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MalformedRequestBodyError';
        this.message = message;
        this.stack = new Error().stack;
        error('%s: %s', this.name, this.message);
    }
}

export class BadCredentialsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BadCredentialsError';
        error('%s: %s', this.name, this.message);
    }
}
export class MissingCredentialsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MissingCredentialsError';
        error('%s: %s', this.name, this.message);
    }
}
export class UnknownJWTMethodError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UnknownJWTMethodError';
        error('%s: %s', this.name, this.message);
    }
}
export class NotImplementedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotImplementedError';
        error('%s: %s', this.name, this.message);
    }
}

export class TokenInvalidError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TokenInvalidError';
        this.message = message;
        this.stack = new Error().stack;
        error('%s: %s', this.name, this.message);
    }
}

export class ForbiddenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ForbiddenError';
        this.message = message;
        this.stack = new Error().stack;
        error('%s: %s', this.name, this.message);
    }
}
export class AuthenticationRequiredError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthenticationRequiredError';
        this.message = message;
        this.stack = new Error().stack;
        error('%s: %s', this.name, this.message);
    }
}