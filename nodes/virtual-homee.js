const crypto = require('crypto');
const enums = require('homee-api/lib/enums');
const Device = require('../lib/device');
const VirtualHomee = require('../lib/virtualHomee');
const discovery = require('../lib/discovery');
const templates = require('../lib/templates');
const icons = require('../lib/icons');
const { debounce } = require('../lib/helpers');

// eslint-disable-next-line
module.exports = function (RED) {
  function VirtualHomeeNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    if (!this.credentials.accessToken) {
      node.debug('no access token available, generating new one...');
      this.credentials.accessToken = crypto.randomBytes(12).toString('hex');
      RED.nodes.addCredentials(node.id, this.credentials);
    }

    this.api = new VirtualHomee(
      config.name,
      this.credentials, {
        log: node.log,
        debug: node.debug,
        error: node.error,
        warn: node.warn,
      },
    );

    // homee expects at least one homee node
    this.devices = [new Device('homee', -1, 1, [], 'default')];
    this.attributeMap = {};

    this.registerDevice = (nodeId, device, callback) => {
      const deviceIndex = this.devices.findIndex((d) => d.id === device.id);

      if (deviceIndex > -1) {
        // deviceId already in use, replace it
        this.devices[deviceIndex] = device;
        node.debug(`updated device: ${device.name}`);
      } else if (!this.checkAttributeIds(device.attributes)) {
        // new device, but attribute check failed
        if (typeof callback === 'function') {
          callback(RED._('virtualHomee.error.attributes-not-unique'));
          return;
        }
      } else {
        // new device, attribute ids are unique
        this.devices.push(device);
        node.debug(`registered device: ${device.name}`);
      }

      device.attributes.forEach((a) => { this.attributeMap[a.id] = nodeId; });
      this.updateNodeList();
      if (typeof callback === 'function') callback();
    };

    this.updateNodeList = debounce(() => {
      this.api.setNodes(this.devices);
      node.debug(`updated device list, found ${this.devices.length - 1} devices`);
    }, 2000);

    this.on('close', async (done) => {
      try {
        await discovery.stop();
        node.debug('closed udp server');
        await this.api.stop();
        node.debug('closed http server');
      } catch (e) {
        node.warn('Could not properly shutdown');
      }
      done();
    });

    this.api.on('PUT:attributes', (attributeId, deviceId, targetValue) => {
      const deviceNode = RED.nodes.getNode(this.attributeMap[attributeId]);

      if (!deviceNode) {
        node.error(new Error(`Can't find device node with attribute id ${attributeId}`));
      } else {
        deviceNode.updateAttribute(attributeId, targetValue);
        deviceNode.send({ payload: { attributeId, targetValue } });
      }
    });

    setTimeout(() => {
      node.debug('starting udp server');
      discovery.start(config.name, node.debug);

      node.debug('starting virtual homee');
      this.api.start();
    }, 3000);

    this.checkAttributeIds = (attributes) => {
      const newAttributeIds = attributes.map((a) => a.id);
      const oldAttributeIds = this.devices.map((d) => d.attributes)
        .reduce((a, b) => a.concat(b), []) // .flat() node v11+
        .map((a) => a.id);

      const doubleAttributeIds = newAttributeIds.filter(
        (id, index) => newAttributeIds.indexOf(id) !== index || oldAttributeIds.indexOf(id) !== -1,
      );

      return !doubleAttributeIds.length;
    };
  }

  RED.httpAdmin.get('/homee-api/enums', (req, res) => res.send(enums));
  RED.httpAdmin.get('/homee-api/icons', (req, res) => res.send(icons));
  RED.httpAdmin.get('/homee-api/template/:path', (req, res) => {
    res.json(templates.find(req.params.path));
  });

  RED.nodes.registerType('virtualHomee', VirtualHomeeNode, {
    credentials: {
      user: { type: 'text' },
      pass: { type: 'password' },
      accessToken: { type: 'password' },
    },
  });
};
