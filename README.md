# Ffat
Create and manage your stateless API with ts and node easily

## Examples
```typescript
import * as ffat from '../index';

ffat.config().start();
```

Example of mapping

```typescript
@RequestMapping('/user', 'GET')
function getUser(res, req, err) {
  // do some stuff
  return { ..yourResponse };
}
```
Auth mapping

```typescript
@RequestAuthMapping('/restricted/somedata', 'GET', 'USR_STD')
function getSomeData(res, req, err) {
  // do some stuff
  return { ..yourResponse };
}

@RequestAuthMapping('/restricted/someadmindata', 'GET', ['USR_STD', 'USR_ADM'])
function getAdminData(res, req, err, ctx) {
  // do some stuff
  return { ..yourResponse };
}
```

### Security options
basic
```typescript

ffat.AuthenticationManager.config().Enable()
  // setting jsonwebtokens time to live to 12h
  .SetTokenTTL(60 * 60 * 12)
  // setting private key for encoding tokens
  .SetKey('myKey')
  // setting encoding alghoritm
  .setAlgorithm('RS256')
  // overriding default login entry point
  .SetLoginEntryPoint('/myCustomLoginUrl')
  // overriding default logout entry point
  .SetLogoutEntryPoint('/myCustomLogoutUrl')
  // overriding the default authentication handler
  .SetAuthenticationHandler(myAuthenticationFunction: AuthenticationContext);

// start the server after the security configuration
ffat.config().start();

```

## Todo
* Token Creation and validation
* Configurations
    * Role definitions
    * Token and security personalization
* Default User Interface
* Environment startup
* RequestRestrictedMapping Decorator
