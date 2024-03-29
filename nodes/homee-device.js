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

      this.attributes.forEach((a) => {
        a.node_id = this.nodeId;
        a.id = parseInt(a.id, 10);
      });

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

      Object.keys(msg.payload).forEach((key) => {
        switch (key) {
          case 'attribute':
            this.updateAttribute(msg.payload.attribute);
            break;
          case 'attributes':
            msg.payload.attributes.forEach((a) => this.updateAttribute(a));
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
     * Updates attribute data
     * @param  {number} id
     * @param  {number} value
     * @param  {number} currentValue
     * @param  {number} targetValue
     * @param  {string} data
     * @return {void}
     */
    this.updateAttribute = ({
      id,
      value,
      currentValue,
      targetValue,
      data,
    }) => {
      if (Number.isFinite(value)) {
        /* eslint-disable no-param-reassign */
        currentValue = value;
        targetValue = value;
        /* eslint-enable no-param-reassign */
      }

      if (!Number.isFinite(id) || (!Number.isFinite(currentValue)
          && !Number.isFinite(targetValue) && data === undefined)) {
        node.warn(RED._('homeeDevice.warning.numeric-id-value'));
        return;
      }

      if (typeof data !== 'undefined' && typeof data !== 'string') {
        node.warn(RED._('homeeDevice.warning.data-string'));
        return;
      }

      const attribute = this.attributes.find((a) => a.id === id);
      const unixTimestamp = Math.round(Date.now() / 1000);

      if (!attribute) {
        node.warn(`${RED._('homeeDevice.warning.attribute-not-found')} ${id}`);
        return;
      }

      if (attribute.last_changed + 2 > unixTimestamp) {
        node.debug(`Attribute #${id} was updated within the last two seconds.`);
      }

      // save data if it is set
      if (typeof data === 'string') attribute.data = data;

      if (typeof targetValue === 'number') {
        node.debug(`updating attribute #${id} to target_value: ${targetValue}`);

        if (targetValue < attribute.minimum || targetValue > attribute.maximum) {
          node.warn(`${RED._('homeeDevice.warning.value-exceeds-min-max')} ${attribute.minimum} ${RED._('homeeDevice.warning.and')} ${attribute.maximum}`);
          return;
        }

        attribute.target_value = targetValue;
        this.virtualHomeeNode.api.send(JSON.stringify({ attribute }));
      }

      if (Number.isFinite(currentValue)) {
        node.debug(`updating attribute #${id} to current_value: ${currentValue}`);

        if (currentValue < attribute.minimum || currentValue > attribute.maximum) {
          node.warn(`${RED._('homeeDevice.warning.value-exceeds-min-max')} ${attribute.minimum} ${RED._('homeeDevice.warning.and')} ${attribute.maximum}`);
          return;
        }

        attribute.last_value = attribute.current_value;
        attribute.current_value = currentValue;
        attribute.last_changed = unixTimestamp;
        this.status({ fill: 'green', shape: 'dot', text: this.device.statusString(this.statusTemplate) });
      }

      this.virtualHomeeNode.api.send(JSON.stringify({ attribute }));
    };
  }

  RED.nodes.registerType('homeeDevice', HomeeDeviceNode);
};
