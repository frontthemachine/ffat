require('dotenv').config();
import * as express from "express";
import * as chalk from "chalk";
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { log, warn, error, info } from "../logger/log";
import { Endpoint } from "../mapping/endpoint";
import { FfatConfig } from './config';
import { AuthConfig, AuthenticationManager } from "../security/authentication-manager";

let endpointList: Endpoint[] = [];
let server = express();


export function AddEndpoint(ep: Endpoint) {
    endpointList.push(ep);
}

/**
 * @name config
 * @description the entry point for Ffat configuration
 * @return an object with configuration methods
 * @example config().logEndpoints(true).start()
 */
export function Config(): Ffat {
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

function parseEndpoints() {
    let counter = 0;
    let loginFound = false;
    let logoutFound = false;

    for (let i = 0; i < endpointList.length; i++) {
        addBinding(endpointList[i]);

        counter += 1;
    }
    
    info('a total of %s endpoints found and processed.', chalk.green(counter.toString()));

    if (FfatConfig.emitEndpointTable) {
        printEndpointTable();
    }
}

function addBinding(ep: Endpoint) {
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
    let rows: {
        [key: string]: {
            GET: 0 | 1 | 2,
            POST: 0 | 1 | 2,
            PUT: 0 | 1 | 2,
            DELETE: 0 | 1 | 2,
            PATCH: 0 | 1 | 2,
        }
    } = {};

    //filling rows
    for (let i = 0; i < endpointList.length; i++) {
        const ep = endpointList[i];
        if (rows[ep.url] === undefined) {
            rows[ep.url] = { DELETE: 0, GET: 0, PATCH: 0, POST: 0, PUT: 0 };
        }
        if (ep.roles && ep.roles.length > 0)  {
            if (AuthConfig.Enabled) {
                rows[ep.url][ep.method] = 2;
            } else {
                rows[ep.url][ep.method] = 1;
                warn('Restricted endpoints detected but %s is not enabled. missing call to %s?', chalk.green('Security'), chalk.green('ffa.config().Enable()'));
            }
        } else {
            rows[ep.url][ep.method] = 1;
        }
    }

    //printing
    //legenda
    console.log();
    console.log('Endpoints: %s public  %s secured  %s not used', chalk.bgYellow('  '), chalk.bgGreen('  '), chalk.bgRed('  '));

    const cols = [
        chalk.bgRed('        '),
        chalk.bgYellow('        '),
        chalk.bgGreen('        ')];
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

export class Ffat {
    public Start(): void {
        const startTime = +new Date();

        parseEndpoints();
        server.listen(process.env.PORT, () => {

            info('listening on port %s.', chalk.green(process.env.PORT));
            info('server startup in %s seconds', chalk.green(((+new Date() - startTime) / 1000).toString()));
        });
    }

    // TODO: configuration with builder pattern
    /**
     * @name EmitEndpointsTable
     * @param value true || false
     * @desc if true, logs a cute table listing the available endpoints
     */
    public EmitEndpointsTable(value: boolean): Ffat {
        FfatConfig.emitEndpointTable = value;
        return this;
    }
}
