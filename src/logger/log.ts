import * as chalk from 'chalk';

const timestamp = require('time-stamp');

export function log(...args: any[]) {
    process.stdout.write(chalk.magenta('Server log' + '[' + chalk.gray(timestamp('YYYY-MM-DD HH:mm:ss:ms')) + ']: '));
    console.log.apply(console, arguments);
    return this;
}

export function info(...args: any[]) {
    process.stdout.write(chalk.cyan('Server info' + '[' + chalk.gray(timestamp('YYYY-MM-DD HH:mm:ss:ms')) + ']: '));
    console.info.apply(console, arguments);
    return this;
}

export function warn(...args: any[]) {
    process.stderr.write(chalk.yellow('Server warn' + '[' + chalk.gray(timestamp('YYYY-MM-DD HH:mm:ss:ms')) + ']: '));
    console.warn.apply(console, arguments);
    return this;
}

export function error(...args: any[]) {
    process.stdout.write(chalk.red(chalk.bold(('Server error')) + '[' + chalk.gray(timestamp('YYYY-MM-DD HH:mm:ss:ms')) + ']: '));
    console.error.apply(console, arguments);
    return this;
}
