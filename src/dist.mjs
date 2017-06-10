var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define("logger/log", ["require", "exports", "chalk"], function (require, exports, chalk) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const timestamp = require('time-stamp');
    function log(...args) {
        process.stdout.write(chalk.magenta('Server log' + '[' + chalk.gray(timestamp('YYYY-MM-DD HH:mm:ss:ms')) + ']: '));
        console.log.apply(console, arguments);
        return this;
    }
    exports.log = log;
    function info(...args) {
        process.stdout.write(chalk.cyan('Server info' + '[' + chalk.gray(timestamp('YYYY-MM-DD HH:mm:ss:ms')) + ']: '));
        console.info.apply(console, arguments);
        return this;
    }
    exports.info = info;
    function warn(...args) {
        process.stderr.write(chalk.yellow('Server warn' + '[' + chalk.gray(timestamp('YYYY-MM-DD HH:mm:ss:ms')) + ']: '));
        console.warn.apply(console, arguments);
        return this;
    }
    exports.warn = warn;
    function error(...args) {
        process.stdout.write(chalk.red(chalk.bold(('Server error')) + '[' + chalk.gray(timestamp('YYYY-MM-DD HH:mm:ss:ms')) + ']: '));
        console.error.apply(console, arguments);
        return this;
    }
    exports.error = error;
});
define("mapping/endpoint", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Endpoint {
        constructor(url, method, handler) {
            this.url = url;
            this.method = method;
            this.handler = handler;
        }
    }
    exports.Endpoint = Endpoint;
});
define("core/config", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FfatConfig {
    }
    FfatConfig.emitEndpointTable = false;
    exports.FfatConfig = FfatConfig;
});
define("security/user", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("security/token-manager", ["require", "exports", "security/authentication-manager", "jsonwebtoken", "logger/log"], function (require, exports, authentication_manager_1, jwt, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var TokenManager;
    (function (TokenManager) {
        function CreateToken(data) {
            const token = jwt.sign({ foo: 'bar' }, authentication_manager_1.AuthConfig.SecretKey, {
                expiresIn: authentication_manager_1.AuthConfig.TokenTTL,
                algorithm: authentication_manager_1.AuthConfig.CryptoAlghoritm
            });
            return token;
        }
        TokenManager.CreateToken = CreateToken;
        function validateToken(token) {
            try {
                const payload = jwt.verify(token, authentication_manager_1.AuthConfig.SecretKey);
                return payload;
            }
            catch (error) {
                // delegate error 
                return error;
            }
        }
        TokenManager.validateToken = validateToken;
    })(TokenManager = exports.TokenManager || (exports.TokenManager = {}));
    class TokenInvalidError extends Error {
        constructor(message) {
            super(message);
            this.name = 'TokenInvalidError';
            this.message = message;
            this.stack = new Error().stack;
            log_1.error('%s: %s', this.name, this.message);
        }
    }
    exports.TokenInvalidError = TokenInvalidError;
});
define("security/authentication-manager", ["require", "exports", "jsonwebtoken", "logger/log", "chalk", "security/token-manager"], function (require, exports, jwt, log_2, chalk, token_manager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AuthenticationManager;
    (function (AuthenticationManager) {
        function Config() {
            return new AuthConfig();
        }
        AuthenticationManager.Config = Config;
    })(AuthenticationManager = exports.AuthenticationManager || (exports.AuthenticationManager = {}));
    function ValidateSession(token) {
        return true;
    }
    exports.ValidateSession = ValidateSession;
    function GetSessionUser(token) {
        return null;
    }
    exports.GetSessionUser = GetSessionUser;
    class AuthConfig {
        SetDefaultLoginHandler() {
            AuthConfig.LoginEntryPoint = '/login';
            AuthConfig.LoginAuthenticationHandler = (req, res) => {
                res.setHeader('Content-Type', 'application/json');
                log_2.log('received \'%s\' request for \'%s\' from \'%s\'', chalk.green(req.method), chalk.green(req.url), chalk.green(req.ip));
                //check auth parameters
                if (!req.body) {
                    res.status(400);
                    res.send({ error: 'missing request body' });
                    res.end();
                    return;
                }
                const username = req.body.username;
                const password = req.body.password;
                if (!username) {
                    res.status(400);
                    res.send(new MissingCredentialsError('parameter \'username\' missing from request body.'));
                    res.end();
                    return;
                }
                if (!password) {
                    res.status(400);
                    res.send(new MissingCredentialsError('parameter \'password\' missing from request body.'));
                    res.end();
                    return;
                }
                let user = {
                    userId: '0',
                    username: 'ffat',
                    password: 'ffat',
                    roles: ['USER']
                };
                if (username !== user.username || password !== user.password) {
                    res.status(401);
                    res.send(new BadCredentialsError('the username/password combination is incorrect.'));
                    res.end();
                    return;
                }
                // getting token
                const token = token_manager_1.TokenManager.CreateToken({ username: username, userId: user.userId });
                // sending token
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
                res.status(200);
                res.send(user);
                res.end();
            };
            return this;
        }
        Enable(value) {
            if (value) {
                AuthConfig.Enabled = value;
            }
            else {
                AuthConfig.Enabled = true;
            }
            return this;
        }
        SetTokenTTL(seconds) {
            if (seconds > 0) {
                AuthConfig.TokenTTL = seconds;
            }
            return this;
        }
        SetAlghoritm(alg) {
            AuthConfig.CryptoAlghoritm = alg;
            return this;
        }
        SetKey(key) {
            if (key.length > 0) {
                AuthConfig.SecretKey = key;
            }
            return this;
        }
        SetLoginEntryPoint(url) {
            AuthConfig.LoginEntryPoint = url;
            return this;
        }
        SetLogoutEntryPoint(url) {
            AuthConfig.LogoutEntryPoint = url;
            return this;
        }
        SetAuthenticationHandler(handler) {
            AuthConfig.AuthenticationHandler = handler;
            return this;
        }
        SetJWTMethod(method) {
            AuthConfig.JWTMethod = method;
            return this;
        }
        SetSessionCookieName(name) {
            AuthConfig.SessionCookieName = name;
            return this;
        }
    }
    AuthConfig.TokenTTL = 60 * 60;
    AuthConfig.Enabled = false;
    AuthConfig.CryptoAlghoritm = 'HS256';
    AuthConfig.LoginEntryPoint = '/login';
    AuthConfig.LogoutEntryPoint = '/logout';
    AuthConfig.JWTMethod = 'use-Cookies';
    AuthConfig.SessionCookieName = 'ffatSession';
    AuthConfig.AuthenticationHandler = (payload) => {
        //propagating error from token validation
        if (payload instanceof jwt.JsonWebTokenError || payload instanceof jwt.TokenExpiredError) {
            return payload;
        }
        let user = {
            userId: '0',
            username: 'ffat',
            password: 'ffat',
            roles: ['USER']
        };
        return new SecurityContext(user);
    };
    exports.AuthConfig = AuthConfig;
    class BadCredentialsError extends Error {
        constructor(message) {
            super(message);
            this.name = 'BadCredentialsError';
            log_2.error('%s: %s', this.name, this.message);
        }
    }
    exports.BadCredentialsError = BadCredentialsError;
    class MissingCredentialsError extends Error {
        constructor(message) {
            super(message);
            this.name = 'MissingCredentialsError';
            log_2.error('%s: %s', this.name, this.message);
        }
    }
    exports.MissingCredentialsError = MissingCredentialsError;
    class UnknownJWTMethodError extends Error {
        constructor(message) {
            super(message);
            this.name = 'UnknownJWTMethodError';
            log_2.error('%s: %s', this.name, this.message);
        }
    }
    exports.UnknownJWTMethodError = UnknownJWTMethodError;
    class SecurityContext {
        constructor(user) {
            this.user = user;
        }
        getUser() {
            return this.user;
        }
    }
    exports.SecurityContext = SecurityContext;
});
define("core/core", ["require", "exports", "express", "chalk", "body-parser", "cookie-parser", "logger/log", "mapping/endpoint", "core/config", "security/authentication-manager"], function (require, exports, express, chalk, bodyParser, cookieParser, log_3, endpoint_1, config_1, authentication_manager_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    require('dotenv').config();
    let endpointList = [];
    let server = express();
    function AddEndpoint(ep) {
        endpointList.push(ep);
    }
    exports.AddEndpoint = AddEndpoint;
    /**
     * @name config
     * @description the entry point for Ffat configuration
     * @return an object with configuration methods
     * @example config().logEndpoints(true).start()
     */
    function Config() {
        console.log(chalk.cyan('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%'));
        console.log(chalk.cyan('%') + chalk.magenta('        _____          _____                                          ') + chalk.cyan('%'));
        console.log(chalk.cyan('%') + chalk.magenta('  ____  \\    \\   ____  \\    \\      _____       ________    ________   ') + chalk.cyan('%'));
        console.log(chalk.cyan('%') + chalk.magenta('  \\   \\ /____/|  \\   \\ /____/|   /      |_    /        \\  /        \\  ') + chalk.cyan('%'));
        console.log(chalk.cyan('%') + chalk.magenta('   |  |/_____|/   |  |/_____|/  /         \\  |\\         \\/         /| ') + chalk.cyan('%'));
        console.log(chalk.cyan('%') + chalk.magenta('   |  |    ___    |  |    ___  |     /\\    \\ | \\            /\\____/ | ') + chalk.cyan('%'));
        console.log(chalk.cyan('%') + chalk.magenta('   |   \\__/   \\   |   \\__/   \\ |    |  |    \\|  \\______/\\   \\     | | ') + chalk.cyan('%'));
        console.log(chalk.cyan('%') + chalk.magenta('  /      /\\___/| /      /\\___/||     \\/      \\\\ |      | \\   \\____|/  ') + chalk.cyan('%'));
        console.log(chalk.cyan('%') + chalk.magenta(' /      /| | | |/      /| | | ||\\      /\\     \\\\|______|  \\   \\       ') + chalk.cyan('%'));
        console.log(chalk.cyan('%') + chalk.magenta(' |_____| /\\|_|/ |_____| /\\|_|/ | \\_____\\ \\_____\\        \\  \\___\\      ') + chalk.cyan('%'));
        console.log(chalk.cyan('%') + chalk.magenta(' |     |/       |     |/       | |     | |     |         \\ |   |      ') + chalk.cyan('%'));
        console.log(chalk.cyan('%') + chalk.magenta(' |_____|        |_____|         \\|_____|\\|_____|          \\|___|      ') + chalk.cyan('%'));
        console.log(chalk.cyan('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%'));
        console.log();
        server.use(bodyParser.json());
        server.use(bodyParser.urlencoded());
        server.use(cookieParser());
        return new Ffat();
    }
    exports.Config = Config;
    function parseEndpoints() {
        let counter = 0;
        let loginFound = false;
        let logoutFound = false;
        for (let i = 0; i < endpointList.length; i++) {
            addBinding(endpointList[i]);
            // check if login/logout mapping are present
            if (endpointList[i].url === authentication_manager_2.AuthConfig.LoginEntryPoint) {
                loginFound = true;
            }
            else if (endpointList[i].url === authentication_manager_2.AuthConfig.LogoutEntryPoint) {
                logoutFound = true;
            }
            counter += 1;
        }
        if (!loginFound) {
            //warn the user
            log_3.warn('no valid login mapping found, the default one will be used');
            authentication_manager_2.AuthenticationManager.Config().SetDefaultLoginHandler();
            const ep = new endpoint_1.Endpoint(authentication_manager_2.AuthConfig.LoginEntryPoint, 'POST', authentication_manager_2.AuthConfig.LoginAuthenticationHandler);
            endpointList.push(ep);
            addBinding(ep);
            counter += 1;
        }
        if (!logoutFound) {
            //warn the user
            log_3.warn('no valid logout mapping found, the default one will be used');
        }
        log_3.info('a total of %s endpoints found and processed.', chalk.green(counter.toString()));
        if (config_1.FfatConfig.emitEndpointTable) {
            printEndpointTable();
        }
    }
    function addBinding(ep) {
        //TODO: return type = boolean, error checking
        switch (ep.method) {
            case 'GET':
                server.get(ep.url, ep.handler);
                break;
            case 'PUT':
                server.put(ep.url, ep.handler);
                break;
            case 'DELETE':
                server.delete(ep.url, ep.handler);
                break;
            case 'PATCH':
                server.patch(ep.url, ep.handler);
                break;
            case 'POST':
                server.post(ep.url, ep.handler);
                break;
            default:
                throw new Error('can\'t use unknown http verbs');
        }
    }
    function printEndpointTable() {
        // URL | GET | POST | PUT | DELETE | PATCH | RESTRICTED |
        let rows = {};
        //filling rows
        for (let i = 0; i < endpointList.length; i++) {
            const ep = endpointList[i];
            if (rows[ep.url] === undefined) {
                rows[ep.url] = { DELETE: 0, GET: 0, PATCH: 0, POST: 0, PUT: 0 };
            }
            if (ep.roles) {
                if (authentication_manager_2.AuthConfig.Enabled) {
                    rows[ep.url][ep.method] = 2;
                }
                else {
                    rows[ep.url][ep.method] = 1;
                    log_3.warn('Restricted endpoints detected but %s is not enabled. missing call to %s?', chalk.green('Security'), chalk.green('ffa.config().Enable()'));
                }
            }
            else {
                rows[ep.url][ep.method] = 1;
            }
        }
        //printing
        //legenda
        console.log();
        console.log('Endpoints: %s public  %s restricted  %s not used', chalk.bgGreen('  '), chalk.bgYellow('  '), chalk.bgRed('  '));
        const cols = [
            chalk.bgRed('        '),
            chalk.bgGreen('        '),
            chalk.bgYellow('        ')
        ];
        const sep = chalk.cyan(' | ');
        const start = chalk.cyan('| ');
        const end = chalk.cyan(' |');
        const top = chalk.cyan('___________________________________________________________________');
        const topEmpty = chalk.cyan('|          |          |          |          |          |          |');
        const middle = chalk.cyan('|__________|__________|__________|__________|__________|__________|');
        console.log(top);
        console.log(topEmpty);
        console.log(start +
            chalk.magenta('  URL   ') + sep +
            chalk.magenta('  GET   ') + sep +
            chalk.magenta(' POST   ') + sep +
            chalk.magenta('  PUT   ') + sep +
            chalk.magenta(' DELETE ') + sep +
            chalk.magenta(' PATCH  ') + end);
        console.log(middle);
        for (let key in rows) {
            console.log(topEmpty);
            let url = key.substr(0, 8);
            if (url.length < 8) {
                //balancing url length
                let diff = 8 - url.length;
                const even = diff % 2 === 0;
                if (!even) {
                    diff -= 1;
                    url += ' ';
                }
                for (let i = 0; i < diff / 2; i++) {
                    url = ' ' + url + ' ';
                }
            }
            console.log(start +
                url + sep +
                cols[rows[key].GET] + sep +
                cols[rows[key].POST] + sep +
                cols[rows[key].PUT] + sep +
                cols[rows[key].DELETE] + sep +
                cols[rows[key].PATCH] + end);
            console.log(middle);
        }
        console.log();
    }
    class Ffat {
        Start() {
            const startTime = +new Date();
            parseEndpoints();
            server.listen(process.env.PORT, () => {
                log_3.info('listening on port %s.', chalk.green(process.env.PORT));
                log_3.info('server startup in %s seconds', chalk.green(((+new Date() - startTime) / 1000).toString()));
            });
        }
        // TODO: configuration with builder pattern
        /**
         * @name EmitEndpointsTable
         * @param value true || false
         * @desc if true, logs a cute table listing the available endpoints
         */
        EmitEndpointsTable(value) {
            config_1.FfatConfig.emitEndpointTable = value;
            return this;
        }
    }
    exports.Ffat = Ffat;
});
define("routing/request-mapping", ["require", "exports", "core/core", "chalk", "logger/log", "mapping/endpoint", "security/authentication-manager", "security/token-manager"], function (require, exports, Core, chalk, log_4, endpoint_2, authentication_manager_3, token_manager_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const paramMetadataKey = Symbol('Param');
    function Param(name) {
        return (target, propertyKey, parameterIndex) => {
            let params = Reflect.getOwnMetadata(paramMetadataKey, target, propertyKey) || [];
            params.push(new UrlParam(parameterIndex, propertyKey));
            Reflect.defineMetadata(paramMetadataKey, params, target);
        };
    }
    exports.Param = Param;
    function Get(url, roles) {
        return (target, propertyKey, descriptor) => {
            // checking if descriptor exists
            if (descriptor === undefined) {
                descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
            }
            // getting param list
            let params = Reflect.getOwnMetadata(paramMetadataKey, target, propertyKey) || [];
            // saving old function
            const old = descriptor.value;
            // decorating function
            descriptor.value = decorate(old, url, params, roles);
            // adding to the Mapping list
            Core.AddEndpoint(new endpoint_2.Endpoint(url, 'GET', descriptor.value));
        };
    }
    exports.Get = Get;
    function Post(url, roles) {
        return (target, propertyKey, descriptor) => {
            // checking if descriptor exists
            if (descriptor === undefined) {
                descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
            }
            // getting param list
            let params = Reflect.getOwnMetadata(paramMetadataKey, target, propertyKey) || [];
            // saving old function
            const old = descriptor.value;
            // decorating function
            descriptor.value = decorate(old, url, params, roles);
            // adding to the Mapping list
            Core.AddEndpoint(new endpoint_2.Endpoint(url, 'POST', descriptor.value));
        };
    }
    exports.Post = Post;
    function Put(url, roles) {
        return (target, propertyKey, descriptor) => {
            // checking if descriptor exists
            if (descriptor === undefined) {
                descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
            }
            // getting param list
            let params = Reflect.getOwnMetadata(paramMetadataKey, target, propertyKey) || [];
            // saving old function
            const old = descriptor.value;
            // decorating function
            descriptor.value = decorate(old, url, params, roles);
            // adding to the Mapping list
            Core.AddEndpoint(new endpoint_2.Endpoint(url, 'PUT', descriptor.value));
        };
    }
    exports.Put = Put;
    function Patch(url, roles) {
        return (target, propertyKey, descriptor) => {
            // checking if descriptor exists
            if (descriptor === undefined) {
                descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
            }
            // getting param list
            let params = Reflect.getOwnMetadata(paramMetadataKey, target, propertyKey) || [];
            // saving old function
            const old = descriptor.value;
            // decorating function
            descriptor.value = decorate(old, url, params, roles);
            // adding to the Mapping list
            Core.AddEndpoint(new endpoint_2.Endpoint(url, 'PATCH', descriptor.value));
        };
    }
    exports.Patch = Patch;
    function Delete(url, roles) {
        return (target, propertyKey, descriptor) => {
            // checking if descriptor exists
            if (descriptor === undefined) {
                descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
            }
            // getting param list
            let params = Reflect.getOwnMetadata(paramMetadataKey, target, propertyKey) || [];
            // saving old function
            const old = descriptor.value;
            // decorating function
            descriptor.value = decorate(old, url, params, roles);
            // adding to the Mapping list
            Core.AddEndpoint(new endpoint_2.Endpoint(url, 'DELETE', descriptor.value));
        };
    }
    exports.Delete = Delete;
    function decorate(old, url, params, roles) {
        return function (req, res, next) {
            //preparing Context
            let context = new ExecutionContext(req, res, next);
            // getting current user (if present)
            const token = getCookie(req.cookies, authentication_manager_3.AuthConfig.SessionCookieName);
            if (token !== null) {
                // there is a session, security is required?
                if (roles) {
                    const valid = authentication_manager_3.ValidateSession(token);
                    if (!valid) {
                        // the token ain't valid
                        const error = new token_manager_2.TokenInvalidError('cannot authenticate becouse the supplied token is not valid.');
                        log_4.log('received \'%s\' request for \'%s\' from \'%s\': status %s: %s', chalk.green('GET'), chalk.green(req.url), chalk.green(req.ip), chalk.red((401).toString()), error.message);
                        res.status(401);
                        res.setHeader('Content-Type', 'application/json');
                        res.send(error);
                        res.end();
                        return;
                    }
                    // the token is valid
                }
                context.user = authentication_manager_3.GetSessionUser(token);
                // if user is null there's no auth required (or maybe the user has been deleted after the validation?)
                // in both cases, no need for other checks
            }
            // checking body integrity
            const targetParams = parseBody(params, req, res);
            if (targetParams === null) {
                // an error has occurred;
                return;
            }
            // now we have all the parameters correctly loaded (if present)
            // logging the request
            log_4.log('received \'%s\' request for \'%s\' from \'%s\': status %s', chalk.green(req.method), chalk.green(req.url), chalk.green(req.ip), 200);
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
                ctxPos = params.length;
            }
            targetParams[ctxPos] = context;
            // applying the old function
            res.send(old.apply(this, targetParams));
            res.end();
        };
    }
    ;
    function parseBody(params, req, res) {
        let targetParams = [];
        if (params.length > 0) {
            const body = req.body;
            //check body
            if (!body) {
                //no body detected
                let error = new MalformedRequestBodyError('request body is missing');
                res.status(400);
                //logging the error on the server
                log_4.log('received \'%s\' request for \'%s\' from \'%s\': status %s: %s', chalk.green('GET'), chalk.green(req.url), chalk.green(req.ip), chalk.red((400).toString()), error.message);
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
                    log_4.log('received \'%s\' request for \'%s\' from \'%s\': status %s: %s', chalk.green('GET'), chalk.green(req.url), chalk.green(req.ip), chalk.red((400).toString()), error.message);
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
    function getCookie(cookies, name) {
        var re = new RegExp(name + "=([^;]+)");
        var value = re.exec(cookies);
        return (value !== null) ? decodeURIComponent(value[1]) : null;
    }
    class UrlParam {
        constructor(index, name) {
            this.index = index;
            this.name = name;
        }
    }
    class ExecutionContext {
        constructor(req, res, next) {
            this.request = req;
            this.response = res;
            this.nextFunction = next;
            this.user = null;
        }
    }
    class MalformedRequestBodyError extends Error {
        constructor(message) {
            super(message);
            this.name = 'MalformedRequestBodyError';
            this.message = message;
            this.stack = new Error().stack;
            log_4.error('%s: %s', this.name, this.message);
        }
    }
    exports.MalformedRequestBodyError = MalformedRequestBodyError;
});
define("index", ["require", "exports", "routing/request-mapping", "core/core", "security/authentication-manager"], function (require, exports, request_mapping_1, core_1, authentication_manager_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Get = request_mapping_1.Get;
    exports.Put = request_mapping_1.Put;
    exports.Post = request_mapping_1.Post;
    exports.Delete = request_mapping_1.Delete;
    exports.Patch = request_mapping_1.Patch;
    exports.Config = core_1.Config;
    exports.AuthenticationManager = authentication_manager_4.AuthenticationManager;
});
define("examples/hello-security", ["require", "exports", "index", "index"], function (require, exports, ffat, index_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HelloWorld {
        static getGreeting() {
            return 'Hello Authorized user!';
        }
    }
    __decorate([
        index_1.Get('/', ['USER']),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], HelloWorld, "getGreeting", null);
    ffat.AuthenticationManager.Config().Enable().SetKey('ciccio');
    ffat.Config().EmitEndpointsTable(true).Start();
});
define("examples/hello-world", ["require", "exports", "index", "index"], function (require, exports, ffat, index_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HelloWorld {
        static getGreeting() {
            return 'Hello World';
        }
    }
    __decorate([
        index_2.Get('/'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], HelloWorld, "getGreeting", null);
    ffat.Config().EmitEndpointsTable(true).Start();
});
