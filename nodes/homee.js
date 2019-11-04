const Homee = require('homee-api');

// eslint-disable-next-line
module.exports = function (RED) {
  function HomeeNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    this.homee = new Homee(config.host, this.credentials.user, this.credentials.pass, {
      device: 'Node-RED',
      reconnect: true,
      reconnectInterval: 5000,
      maxRetries: Infinity,
    });

    this.homee.on('message', () => {
      node.context().global.set('homee.nodes', node.homee.nodes);
      node.context().global.set('homee.groups', node.homee.groups);
      node.context().global.set('homee.attributes', node.homee.attributes);
    });

    this.homee.on('error', (err) => {
      node.log(err);
    });

    this.homee.connect().then(() => {
      node.log('connected to homee');
    }).catch((err) => {
      node.error(err);
    });

    this.on('close', () => {
      this.homee.disconnect();
      node.log('homee: connection closed');
    });
  }

  RED.nodes.registerType('homee', HomeeNode, {
    credentials: {
      user: { type: 'text' },
      pass: { type: 'password' },
    },
  });
};
