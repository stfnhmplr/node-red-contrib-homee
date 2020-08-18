// eslint-disable-next-line
module.exports = function (RED) {
  function messageContains(msg, type, id) {
    const strMsg = JSON.stringify(msg);
    if (strMsg.indexOf(`"${type}_id":${id}`) !== -1) return true;

    const msgType = Object.keys(msg)[0];
    if (msgType === type && strMsg.indexOf(`"id":${id}`) !== -1) return true;

    return false;
  }

  function HomeeApiNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const { homee } = RED.nodes.getNode(config.homee);

    node.status({ fill: 'red', shape: 'dot', text: 'node-red:common.status.not-connected' });

    homee.on('connected', () => {
      node.status({ fill: 'green', shape: 'dot', text: 'node-red:common.status.connected' });
    });

    homee.on('disconnected', () => {
      node.status({ fill: 'red', shape: 'dot', text: 'node-red:common.status.disconnected' });
    });

    homee.on('reconnect', () => {
      node.status({ fill: 'yellow', shape: 'dot', text: 'node-red:common.status.connecting' });
    });

    homee.on('message', (message) => {
      // singularize message type
      const messageType = Object.keys(message)[0].replace(/s$/, '');
      if (Array.isArray(config.messageTypeFilter)
        && config.messageTypeFilter.length
        && config.messageTypeFilter.indexOf(messageType) === -1) return;

      if (config.nodeFilter && !messageContains(message, 'node', config.nodeFilter)) return;
      if (config.attributeFilter && !messageContains(message, 'attribute', config.attributeFilter)) return;

      node.send({ payload: message });
    });

    this.on('input', (msg) => {
      homee.send(msg.payload);
    });
  }

  RED.nodes.registerType('homeeApi', HomeeApiNode);
};
