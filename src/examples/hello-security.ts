import * as ffat from '../index';
import { Request, Response, NextFunction } from 'express';
import { Get, AuthenticationProvider, CredentialProvider, LoginSuccessHandler, Param } from '../index';

class HelloWorld {

    @Get('/', ['USER'])
    static getGreeting() {
        return 'Hello Authorized user!';
    }
}

class MyUser implements ffat.User {
    constructor(id: string, username: string, password: string, roles: string[]) {
        this.UserId = id;
        this.Username = username;
        this.Password = password;
        this.Roles = roles;
    }
    public UserId: string;
    public Username: string;
    public Password: string;
    public Roles: string[];
}

class MyApp {

    @CredentialProvider()
    myCredentialProvider(myData: any) {
        return new MyUser('001', 'ffat', 'ffat', ['USER']);
    }

    @AuthenticationProvider()
    myAuthenticationProvider(@Param('username')username: string, @Param('password')password: string) {
        if (username === 'ffat' && password === 'ffat') {
            return { user: username, pwd: password };
        }
        return new ffat.BadCredentialsError('the credential are incorrect');
    }

    @LoginSuccessHandler('/login')
    myLoginSuccessHandler(req: Request, res: Response, user: ffat.User) {
        res.send(user);
        res.end();
    }
}




ffat.AuthenticationManager.Config().Enable().SetKey('ciccio');
ffat.Config().EmitEndpointsTable(true).Start();