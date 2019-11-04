const Device = require('../lib/device');

// eslint-disable-next-line
module.exports = function (RED) {
  function HomeeDeviceNode(config) {
    RED.nodes.createNode(this, config);

    const node = this;
    let attributes = [];

    try {
      attributes = JSON.parse(config.attributes);
    } catch (e) {
      node.error('Can\'t parse attributes. Please check your JSON Syntax');
    }

    const invalidAttributes = attributes.filter((a) => a.node_id !== parseInt(config.nodeId, 10));
    if (invalidAttributes.length) {
      node.error('The node id of at least one attribute does not match the device node id');
    }

    this.device = new Device(config.name, config.nodeId, config.profile, attributes, config.icon);

    const virtualHomeeNode = RED.nodes.getNode(config['homee-sim']);

    // new value from flow
    this.on('input', (msg) => {
      if (typeof msg.payload.id !== 'number' || typeof msg.payload.value !== 'number') {
        node.warn('payload.id and payload.value must be numeric. ignoring message.');
        return;
      }

      this.updateAttribute(msg.payload.id, msg.payload.value);
    });

    this.on('close', () => {
      node.status({ fill: 'red', shape: 'dot', text: 'offline' });
    });

    /**
     * update attribute
     * @param  {int} id        the attribute id
     * @param  {int|float} value  new value
     * @return {void}
     */
    this.updateAttribute = (id, value) => {
      const attribute = this.device.attributes.find((a) => a.id === id);

      if (!attribute) {
        node.warn(`Can't find attribute with id ${id}`);
        return;
      }

      node.debug(`updating attribute #${id} to value: ${value}`);

      if (value < attribute.minimum || value > attribute.maximum) {
        node.warn(`can't update attribute. The provided value must be
            between ${attribute.minimum} and ${attribute.maximum}`);
        return;
      }

      if (attribute.target_value === value) {
        node.debug(`Attribute #${id} is already updated`);
        return;
      }

      // first update target value only
      attribute.target_value = value;
      virtualHomeeNode.api.send(JSON.stringify({ attribute }));

      // next update current_value
      attribute.last_value = value;
      attribute.current_value = value;
      virtualHomeeNode.api.send(JSON.stringify({ attribute }));
    };
  }

  RED.nodes.registerType('homeeDevice', HomeeDeviceNode);
};
