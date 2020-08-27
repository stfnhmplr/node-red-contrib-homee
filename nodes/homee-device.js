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
    this.statusTemplate = config.statusTemplate;
    this.storageConfigured = RED.settings.contextStorage && 'homeeStore' in RED.settings.contextStorage;

    if (this.nodeId === -1) throw new Error(RED._('homeeDevice.error.homee-node-id'));

    try {
      if (typeof config.attributes === 'string') {
        this.attributes = JSON.parse(config.attributes);
      } else {
        this.attributes = config.attributes;
      }

      if (!Array.isArray(this.attributes)) throw new Error(RED._('homeeDevice.error.attributes-must-be-array'));

      if (this.attributes.filter((a) => a.node_id !== this.nodeId).length) {
        throw new Error(RED._('homeeDevice.error.node-ids-dont-match'));
      }

      if (this.storageConfigured) {
        node.context().get('attributes', 'homeeStore', (err, attributes) => {
          if (err || !Array.isArray(attributes)) {
            node.debug(`Can't load data from storage for device #${this.nodeId}, ${err}`);
            return;
          }

          attributes.forEach((storedAttribute) => {
            const attribute = this.attributes.find((a) => a.id === storedAttribute.id);
            if (!attribute) return;
            attribute.current_value = storedAttribute.current_value;
            attribute.target_value = storedAttribute.target_value;
            attribute.data = storedAttribute.data;

            this.virtualHomeeNode.api.send(JSON.stringify({ attribute }));
          });

          node.debug(`loaded data from storage for device #${this.nodeId}`);
        });
      }

      this.device = new Device(this.name, this.nodeId, this.profile, this.attributes, this.icon);
      this.status({ fill: 'green', shape: 'dot', text: this.device.statusString(this.statusTemplate) });

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
        node.warn(RED._('homeeDevice.warning.invalid-payload'));
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
            this.updateAttribute(
              msg.payload.attribute.id,
              msg.payload.attribute.value,
              msg.payload.attribute.data,
            );
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
        node.status({ fill: 'red', shape: 'dot', text: this.device.statusString(this.statusTemplate) });
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
     * @param  {int} id  the attribute id
     * @param  {int|float} value  new value
     * @param  {string} data    new data
     * @return {void}
     */
    this.updateAttribute = (id, value, data) => {
      if (typeof id !== 'number' || typeof value !== 'number') {
        node.warn(RED._('homeeDevice.warning.numeric-id-value'));
        return;
      }

      const attribute = this.attributes.find((a) => a.id === id);
      const unixTimestamp = Math.round(Date.now() / 1000);

      if (!attribute) {
        node.warn(`${RED._('homeeDevice.warning.attribute-not-found')} ${id}`);
        return;
      }

      node.debug(`updating attribute #${id} to value: ${value}`);

      if (value < attribute.minimum || value > attribute.maximum) {
        node.warn(`${RED._('homeeDevice.warning.value-exceeds-min-max')} ${attribute.minimum} ${RED._('homeeDevice.warning.and')} ${attribute.maximum}`);
        return;
      }

      if (attribute.target_value === value && attribute.last_changed + 2 > unixTimestamp) {
        node.debug(`Attribute #${id} was updated within the last two seconds.`);
      }

      // first update target value only
      attribute.target_value = value;
      this.virtualHomeeNode.api.send(JSON.stringify({ attribute }));

      // save data if it is set
      if (typeof data !== 'undefined') {
        attribute.data = data;
      }

      // next update current_value
      attribute.last_value = attribute.current_value;
      attribute.current_value = value;
      attribute.last_changed = unixTimestamp;
      this.virtualHomeeNode.api.send(JSON.stringify({ attribute }));
      this.status({ fill: 'green', shape: 'dot', text: this.device.statusString(this.statusTemplate) });
    };
  }

  RED.nodes.registerType('homeeDevice', HomeeDeviceNode);
};
