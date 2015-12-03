'use strict';

const Client = require('ssh2').Client;

/** Class representing a Egg. */
class Egg {
  /**
   * Create a Egg.
   * @param {object} payload - Payload containing server object as well as tasks and an output function.
   */
  constructor(payload) {
    this.server       = payload.server;
    this.tasks        = payload.tasks;
    this.output       = payload.output;

    this.conn         = new Client();
    this.connected    = false;
    this.tasks_run    = false;
    this.readyToTest  = false;
    this.test         = (payload.test) ? payload.test : false;
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
    let that = this;
    (function task_map(index){
      if(index < that.tasks.length) {
        let task = that.tasks[index];
        let tasks_completed = 1;

        that.conn.exec(task, (err, stream)=> {

          if (err) throw err;
          stream.on('close', (code, signal)=> {

            tasks_completed++;

            if(tasks_completed >= that.tasks.length) {
              if( that.test ) {
                that.readyToTest = true;
              }else {
                that.conn.end();
              }
            }

            that.output(false, 'Stream :: close :: code: ' + code + ', signal: ' + signal);
            task_map(index + 1);

          }).on('data', (data)=> {

            that.output(false, data.toString());

          }).stderr.on('data', (data)=> {

            that.output('error', 'STDERR: ' + data);

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
  hatch() {
    this.output('Meep. Meep.');
    this.connect();
    return this;
  }
}

module.exports = Egg;
