const Homee = require('homee-api');

// eslint-disable-next-line
module.exports = function (RED) {
  function HomeeNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    this.homee = new Homee(config.host, this.credentials.user, this.credentials.pass, {
      device: config.device,
      reconnect: true,
      reconnectInterval: 5000,
      maxRetries: Infinity,
    });

    if (config.globalContext) {
      this.homee.on('message', (message) => {
        const [messageType] = Object.keys(message);
        const storageKeys = [
          'attributes',
          'nodes',
          'groups',
          'homeegrams',
          'plans',
          'relationships',
        ];

        if (messageType === 'all') {
          storageKeys.forEach((key) => node.context().global.set(`homee.${key}`, node.homee[key]));
        } else if (['attribute', 'attributes', 'node', 'nodes'].includes(messageType)) {
          node.context().global.set('homee.attributes', node.homee.attributes);
          node.context().global.set('homee.nodes', node.homee.nodes);
        } else if (['groups', 'homeegrams', 'plans', 'relationships'].includes(messageType)) {
          node.context().global.set(`homee.${messageType}`, node.homee[messageType]);
        } else if (['group', 'homeegram', 'plan', 'relationship'].includes(messageType)) {
          node.context().global.set(`homee.${messageType}s`, node.homee[`${messageType}s`]);
        }
      });
    }

    this.homee.on('error', (err) => node.log(err));

    this.homee.connect().then(() => {
      node.log('connected to homee');
    }).catch((err) => {
      node.error(err);
    });

    this.on('close', () => this.homee.disconnect());
  }

  RED.nodes.registerType('homee', HomeeNode, {
    credentials: {
      user: { type: 'text' },
      pass: { type: 'password' },
    },
  });
};
