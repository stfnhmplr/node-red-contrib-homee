const enums = require('homee-api/lib/enums');
const VirtualHomee = require('../lib/virtualHomee');
const Device = require('../lib/device');
const discovery = require('../lib/discovery');
const icons = require('../lib/icons');

// eslint-disable-next-line
module.exports = function (RED) {
  function VirtualHomeeNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    this.api = new VirtualHomee(config.name, this.credentials.user, this.credentials.pass);

    this.on('close', async (done) => {
      await discovery.stop();
      node.debug('closed udp server');
      await this.api.stop();
      node.debug('closed http server');
      done();
    });


    this.api.on('PUT:attributes', (attributeId, deviceId, targetValue) => {
      let deviceNode;

      try {
        deviceNode = RED.nodes.getNode(this.attributeMap[attributeId]);
      } catch (e) {
        node.error(e);
        return;
      }

      deviceNode.updateAttribute(attributeId, targetValue);
      deviceNode.send({
        payload: { attributeId, targetValue },
      });
    });

    // TODO: change this to RED.events.on('nodes-started')
    setTimeout(() => {
      this.devices = [];
      this.attributeMap = {};
      this.childNodes = {};

      const homeeNode = new Device('homee', -1, 1, [], 'default');
      this.devices.push(homeeNode);

      node.debug('discovering devices');
      RED.nodes.eachNode((n) => {
        if (n.type === 'homeeDevice') {
          const deviceNode = RED.nodes.getNode(n.id);
          if (!deviceNode) {
            node.error(`Can't find node ${n.id}`);
            return;
          }

          this.devices.push(deviceNode.device);
          deviceNode.device.attributes.forEach((a) => { this.attributeMap[a.id] = n.id; });
          deviceNode.status({ fill: 'green', shape: 'dot', text: 'online' });
        }
      });

      if (!this.checkDeviceIds() || !this.checkAttributeIds()) {
        node.error('The device IDs and the attribute IDs must be unique');
      }

      node.debug(`found ${this.devices.length - 1} devices`);

      this.api.setNodes(this.devices);

      node.debug('starting udp server');
      discovery.start(config.name, node.debug);

      node.debug('starting virtual homee');
      this.api.start();
    }, 3000);

    this.checkDeviceIds = () => {
      const deviceIds = this.devices.map((d) => d.id);
      const doubleDeviceIds = deviceIds.filter(
        (id) => deviceIds.indexOf(id) !== deviceIds.lastIndexOf(id),
      );

      return !doubleDeviceIds.length;
    };

    this.checkAttributeIds = () => {
      const attributeIds = this.devices.map((d) => d.attributes)
        // .flat() node v11+
        .reduce((a, b) => a.concat(b), [])
        .map((a) => a.id);
      const doubleAttributeIds = attributeIds.filter(
        (id) => attributeIds.indexOf(id) !== attributeIds.lastIndexOf(id),
      );

      return !doubleAttributeIds.length;
    };
  }

  RED.httpAdmin.get('/homee-api/enums', (req, res) => {
    res.send(enums);
  });

  RED.httpAdmin.get('/homee-api/icons', (req, res) => {
    res.send(icons);
  });

  RED.nodes.registerType('virtualHomee', VirtualHomeeNode, {
    credentials: {
      user: { type: 'text' },
      pass: { type: 'password' },
    },
  });
};
