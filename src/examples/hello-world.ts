import * as ffat from '../index';
import { Request, Response, NextFunction } from 'express';
import { Get } from '../index';

class HelloWorld {

    @Get('/')
    static getGreeting() {
        return 'Hello World';
    }
 }

ffat.Config().EmitEndpointsTable(true).Start();