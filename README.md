# Egg
The egg is a hatchable little package that can be used on a nest to build and deploy software and apps.
It supports authentication, task running, and simple testing.

A basic usage example is provided below.

## Usage

```javascript
var Egg = require('meep-egg');
var egg = new Egg({
  server: {
    host: '192.0.0.1',
    user: 'root',
    password: 'password',
    port: 22
  },
  tasks: [
    'curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -',
    'apt-get install -y nodejs'
  ],
  test: true
});

egg.hatch().expect('node -v').match(new RegExp(/v4\..*\..*/), (res)=>{
  if(typeof(res) !== 'null') {
    console.log(`Tests passed, Node version ${res[0]} installed.`);
  }
});
```
