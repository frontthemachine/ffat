# FFAT
Create and manage your stateless API with ts and node easily

##Examples
```typescript
const ffat = require('ffat')

ffat.config({
  ..configs
});
```

example of mapping

```typescript
@RequestMapping('/user', 'GET')
function getUser(res, req, err) {
  // do some stuff
  return { ..yourResponse };
}
```

## Todo
* Token Creation and validation
* Configurations
** Role definitions
** Token and security personalization
* Default User Interface
* Environment startup
* RequestMapping Annotation
