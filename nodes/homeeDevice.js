const Device = require('../lib/device');

// eslint-disable-next-line
module.exports = function (RED) {
  function HomeeDeviceNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.virtualHomeeNode = RED.nodes.getNode(config['virtual-homee']);
    this.icon = config.icon;
    this.name = config.name;
    this.nodeId = parseInt(config.nodeId, 10);
    this.profile = parseInt(config.profile, 10);
    this.storageConfigured = RED.settings.contextStorage && 'homeeStore' in RED.settings.contextStorage;

    if (this.nodeId === -1) throw new Error('The node id must not be -1');

    try {
      this.attributes = JSON.parse(config.attributes);
      if (!Array.isArray(this.attributes)) throw new Error('Attributes must be an array');

      if (this.attributes.filter((a) => a.node_id !== this.nodeId).length) {
        throw new Error('The node id of at least one attribute does not match the device node id');
      }

      if (this.storageConfigured) {
        node.context().get('attributes', 'homeeStore', (err, attributes) => {
          if (err || !Array.isArray(attributes)) {
            node.debug(`Can't load data from storage for device #${this.nodeId}, ${err}`);
            return;
          }

          attributes.forEach((storedAttribute) => {
            const attribute = this.attributes.find((a) => a.id === storedAttribute.id);
            attribute.current_value = storedAttribute.current_value;
            attribute.target_value = storedAttribute.target_value;
            this.virtualHomeeNode.api.send(JSON.stringify({ attribute }));
          });

          node.debug(`loaded data from storage for device #${this.nodeId}`);
        });
      }

      this.device = new Device(this.name, this.nodeId, this.profile, this.attributes, this.icon);
      this.status({ fill: 'green', shape: 'dot', text: this.device.statusString() });

      this.virtualHomeeNode.registerDevice(this.id, this.device, (err) => {
        if (err) throw Error(err);
      });
    } catch (e) {
      this.status({ fill: 'red', shape: 'dot', text: 'error' });
      this.error(e);
    }

    // new value from flow
    this.on('input', (msg) => {
      if (typeof msg.payload !== 'object') {
        node.warn('Only JSON-Objects are valid payloads. Ignoring message.');
        return;
      }

      if ('id' in msg.payload && 'value' in msg.payload) {
        node.warn(`using an object with id and value is deprecated.
          You'll find the new syntax in the README.`);
        this.updateAttribute(msg.payload.id, msg.payload.value);
        return;
      }

      Object.keys(msg.payload).forEach((key) => {
        switch (key) {
          case 'attribute':
            this.updateAttribute(msg.payload.attribute.id, msg.payload.attribute.value, msg.payload.attribute.data);
            break;
          case 'attributes':
            msg.payload.attributes.forEach((a) => this.updateAttribute(a.id, a.value, a.data));
            break;
          case 'state':
            this.updateNode(key, msg.payload[key]);
            break;
          default:
            node.warn('Invalid message. Please check the Readme/Wiki. Ignoring message');
        }
      });
    });

    this.on('close', (done) => {
      if (!this.storageConfigured) {
        done();
        return;
      }

      node.context().set('attributes', this.attributes, 'homeeStore', (err) => {
        if (err) node.debug(`Can't store data for device #${this.nodeId}, ${err}`);

        node.debug(`stored data for device #${this.nodeId}`);
        node.status({ fill: 'red', shape: 'dot', text: this.device.statusString() });
        done();
      });
    });

    /**
     * update node
     * @param  {string} key
     * @param  {mixed} value
     * @return {void}
     */
    this.updateNode = (key, value) => {
      this.device[key] = value;
      if (key === 'state') this.device.state_changed = Math.floor(Date.now() / 1000);
      this.virtualHomeeNode.api.send(JSON.stringify({ node: this.device }));
      node.debug(`updated ${key} of node #${this.device.id} to value ${value}`);
    };

    /**
     * update attribute
     * @param  {int} id        the attribute id
     * @param  {int|float} value  new value
     * @param  {string} data    new data
     * @return {void}
     */
    this.updateAttribute = (id, value, data) => {
      if (typeof id !== 'number' || typeof value !== 'number') {
        node.warn('id and value must be numeric. ignoring message.');
        return;
      }

      const attribute = this.attributes.find((a) => a.id === id);
      const unixTimestamp = Math.round(Date.now() / 1000);

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

      if (attribute.target_value === value && attribute.last_changed + 2 > unixTimestamp) {
        node.debug(`Attribute #${id} was updated within the last two seconds.`);
      }

      // first update target value only
      attribute.target_value = value;
      this.virtualHomeeNode.api.send(JSON.stringify({ attribute }));

      // next update current_value and data
      attribute.last_value = attribute.current_value;
      attribute.current_value = value;
      attribute.data = data;
      attribute.last_changed = unixTimestamp;
      this.virtualHomeeNode.api.send(JSON.stringify({ attribute }));
      this.status({ fill: 'green', shape: 'dot', text: this.device.statusString() });
    };
  }

  RED.nodes.registerType('homeeDevice', HomeeDeviceNode);
};
