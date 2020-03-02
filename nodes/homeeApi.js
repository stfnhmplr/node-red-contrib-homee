// eslint-disable-next-line
module.exports = function (RED) {
  function HomeeApiNode(config) {
    RED.nodes.createNode(this, config);

    const node = this;
    const { homee } = RED.nodes.getNode(config.homee);

    node.status({ fill: 'red', shape: 'dot', text: 'disconnected' });

    homee.on('connected', () => {
      node.status({ fill: 'green', shape: 'dot', text: 'connected' });
    });

    homee.on('disconnected', () => {
      node.status({ fill: 'red', shape: 'dot', text: 'disconnected' });
    });

    homee.on('reconnect', () => {
      node.status({ fill: 'yellow', shape: 'dot', text: 'reconnecting...' });
    });

    homee.on('message', (message) => {
      node.send({ payload: message });
    });

    this.on('input', (msg) => {
      homee.send(msg.payload);
    });
  }

  RED.nodes.registerType('homeeApi', HomeeApiNode);
};
