'use strict';

const Client = require('ssh2').Client;

/** Class representing a Meepfile. */
class Meepfile {
  /**
   * Create a Meepfile.
   * @param {object} payload - Payload containing server object as well as tasks and an output function.
   */
  constructor(payload) {
    this.server     = payload.server;
    this.tasks      = payload.tasks;
    this.output     = payload.output;

    this.test      = (payload.test) ? payload.test : false;
    this.conn       = new Client();
    this.tasks_run  = false;
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
  * Run the tasks provided to Meepfile.
  */
  run() {
    this.tasks.map((task)=> {
      let tasks_completed = 0;

      this.conn.exec(task, (err, stream)=> {

        if (err) throw err;
        stream.on('close', (code, signal)=> {

          tasks_completed++;

          if(tasks_completed >= this.tasks.length && !this.test) {
            this.conn.end();
          }

          this.output(false, 'Stream :: close :: code: ' + code + ', signal: ' + signal);

        }).on('data', (data)=> {

          this.output(false, 'STDOUT: ' + data);

        }).stderr.on('data', (data)=> {

          this.output('error', 'STDERR: ' + data);

        });
      });

    });
  }

  /**
  * Test that our tasks were successful.
  */
  expect(command) {
    // Just a simple regex test for now.
    let match = function(expression, callback) {
      this.conn.exec(task, (err, stream)=> {

        if (err) throw err;
        stream.on('close', (code, signal)=> {

        }).on('data', (data)=> {

          let condition = data.match(expression);
          
          callback(condition);
          this.conn.end();

          this.output(false, 'STDOUT: ' + data);

        }).stderr.on('data', (data)=> {

          this.output('error', 'STDERR: ' + data);

        });
      });
    };
  }

  /**
  * Run the Meepfile. Meep. Meep.
  */
  meep() {
    this.output('Meep. Meep.');
    this.connect();
  }
}

module.exports = Meepfile;
