'use strict';
const ProgressBar = require('progress');
const Client = require('ssh2').Client;

const genPass = function (length) {
    var chars = "abcdefghijklmnopqrstuvwxyz!@#$%^&*()-+<>ABCDEFGHIJKLMNOP1234567890";
    var pass = "";
    for (var x = 0; x < length; x++) {
        var i = Math.floor(Math.random() * chars.length);
        pass += chars.charAt(i);
    }
    return pass;
}

/** Class representing a Egg. */
class Egg {
  /**
   * Create a Egg.
   * @param {object} payload - Payload containing server object as well as tasks and an output function.
   */
  constructor(payload) {
    this.server       = payload.server;
    this.tasks        = payload.tasks;
    this.output       = (payload.output) ? payload.output : (m) => {} ;

    this.conn         = new Client();
    this.connected    = false;
    this.tasks_run    = false;
    this.readyToTest  = false;
    this.test         = (payload.test) ? payload.test : false;
    this.password     = genPass(8);

    this.tickCallback = (payload.tickCallback) ? payload.tickCallback : () => {};

    this.tasks_step   = 1;
  }

  /**
  * Connect to the host.
  */
  connect() {
    this.conn.on('ready', ()=> {
      this.run();
    }).connect({
      host: this.server.host,
      port: (this.server.port) ? this.server.port : 22,
      username: (this.server.user) ? this.server.user : 'root',
      password: this.server.password
    });
  }

  /**
  * Run the tasks provided to Egg.
  */
  run() {
    console.log();
    let bar = new ProgressBar('Installing [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: this.tasks.length
    });
    let that = this;

    (function task_map(index){
      if(index < that.tasks.length) {
        let task = that.tasks[index];

        that.conn.exec(task, (err, stream)=> {

          if (err) that.output(true, err);
          stream.on('close', (code, signal)=> {

            bar.tick(1);
            that.tickCallback(1, that.tasks.length);

            if(that.tasks_step === that.tasks.length) {
              console.log('Done.');
              if( that.test ) {
                that.readyToTest = true;
              }else {
                that.conn.end();
              }
            } else{
              that.tasks_step = that.tasks_step + 1;
              task_map(index + 1);
            }

          }).on('data', (data)=> {

            that.output(false, data.toString());

          }).stderr.on('data', (data)=> {

            that.output(false, data.toString());

          });
        });
      }
    })(0);
  }

  /**
  * Test that our tasks were successful.
  */
  expect(command) {
    // Just a simple regex test for now.
    var that = this;
    let match = (expression, callback)=> {
      (function wait() {
        if(that.readyToTest) {
          that.conn.exec(command, (err, stream)=> {
            if (err) throw err;
            stream.on('close', (code, signal)=> {

            }).on('data', (data)=> {
              let condition = data.toString().match(expression);

              callback(condition);
              that.conn.end();

              that.output(false, 'STDOUT: ' + data);

            }).stderr.on('data', (data)=> {

              that.output('error', 'STDERR: ' + data);

            });
          });
        } else {
          setTimeout( wait, 500 );
        }
      })();
    };
    return {
      match
    };
  }

  /**
  * Hatch the Egg. Meep. Meep.
  */
  hatch(callback) {
    callback({ password: this.password });
    this.output('Meep. Meep.');
    this.connect();
    return this;
  }
}

module.exports = Egg;
