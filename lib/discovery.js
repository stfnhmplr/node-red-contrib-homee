const dgram = require('dgram');
const { iequals } = require('./helpers');

let server;

/**
 * starts the discovery server and listens for given alias
 * @param {string} alias
 */
function start(alias, debug) {
  server = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  server.bind(15263);

  server.on('message', (message, rinfo) => {
    debug(`Discovery server receive message : ${message}`);

    if (iequals(message.toString(), alias.toString())) {
    // initialized:00055107F7B1:00055107F7B1:homee
    // eslint-disable-next-line
      message = new Buffer.from(`initialized:${alias}:${alias}:homee`);
      server.send(message, 0, message.length, rinfo.port, rinfo.address);
    } else {
      debug(`message did not match alias: ${message}__vs__${alias}`);
    }
  });


  server.on('listening', () => {
    const address = server.address();
    debug(`UDP Server started and listening on ${address.address}:${address.port}`);
  });
}

function stop() {
  return new Promise((resolve) => {
    server.close(() => {
      server = {};
      resolve();
    });
  });
}

module.exports = {
  start,
  stop,
};
