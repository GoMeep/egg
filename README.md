# Meepfile

## Usage

```javascript
var Meepfile = require('meep-meepfile');
var meep = new Meepfile({
  server: {
    host: '192.167.0.4',
    user: 'root',
    password: 'psw123',
    port: 22
  },
  tasks: [
    'curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -',
    'apt-get install -y nodejs'
  ],
  test: true,
  output: function(err, msg) {
    if(err) {
      console.log(err);
    }
    console.log(msg);
  }
});

meep.meep().expect('node -v').match(new RegExp(/v4\..*\..*/), (res)=>{
  if(typeof(res) !== 'null') {
    console.log(`Tests passed, Node version ${res[0]} installed.`);
  }
});
```
