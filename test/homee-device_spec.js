const helper = require('node-red-node-test-helper');
const virtualHomeeNode = require('../nodes/virtual-homee.js');
const homeeDeviceNode = require('../nodes/homee-device.js');

helper.init(require.resolve('node-red'));

describe('homeeDevice Node', () => {
  before((done) => helper.startServer(done));
  after((done) => helper.stopServer(done));
  afterEach(() => helper.unload());

  // eslint-disable-next-line
  const defaultFlow = [{id: 'n2', type :"homeeDevice", 'virtual-homee': 'n1', name: 'TestDevice', nodeId: '1', 'showNodeId': true, profile: '10', icon: 'default', attributes: '[{"id": 1, "node_id": 1, "instance": 0, "minimum": 0, "maximum": 1, "current_value": 0, "target_value": 0, "last_value": 0, "unit": "", "step_value": 1, "editable": 1, "type": 1, "state": 1, "last_changed": 1572944008, "changed_by": 0, "changed_by_id": 0, "based_on": 1, "data": ""}]'}, {id: 'n1', type: 'virtualHomee', name: 'virtualHomee'}];
  const credentials = { user: 'foo', pass: 'bar' };

  it('should be loaded', (done) => {
    helper.load([virtualHomeeNode, homeeDeviceNode], defaultFlow, { n1: credentials }, () => {
      const n2 = helper.getNode('n2');
      n2.should.have.property('name', 'TestDevice');
      done();
    });
  });

  it('should register as device at configured virtual homee', (done) => {
    helper.load([virtualHomeeNode, homeeDeviceNode], defaultFlow, { n1: credentials }, () => {
      const n1 = helper.getNode('n1');
      n1.should.have.property('devices').which.is.an.Array();
      n1.devices.should.have.size(2);
      n1.devices[1].should.have.value('name', 'TestDevice');
      done();
    });
  });

  it('should warn if the payload is not an object', (done) => {
    helper.load([virtualHomeeNode, homeeDeviceNode], defaultFlow, { n1: credentials }, () => {
      const n2 = helper.getNode('n2');

      n2.on('input', (msg) => {
        msg.should.have.value('payload', 'invalid');
        n2.warn.should.be.called();
        done();
      });

      n2.receive({ payload: 'invalid' });
    });
  });

  it('should warn if id and value is not numeric', (done) => {
    helper.load([virtualHomeeNode, homeeDeviceNode], defaultFlow, { n1: credentials }, () => {
      const n2 = helper.getNode('n2');

      n2.on('input', () => {
        n2.warn.should.be.calledWithExactly('homeeDevice.warning.numeric-id-value');
        done();
      });

      n2.receive({
        payload: {
          attribute: {
            id: 'not a number',
            value: 'some random string',
          },
        },
      });
    });
  });

  it('should warn if the attribute cannot be found', (done) => {
    helper.load([virtualHomeeNode, homeeDeviceNode], defaultFlow, { n1: credentials }, () => {
      const n2 = helper.getNode('n2');

      n2.on('input', () => {
        n2.warn.should.be.calledWithExactly('homeeDevice.warning.attribute-not-found 10');
        done();
      });

      n2.receive({
        payload: {
          attribute: {
            id: 10,
            value: 1,
          },
        },
      });
    });
  });

  it('should warn if the new value is above the max value', (done) => {
    helper.load([virtualHomeeNode, homeeDeviceNode], defaultFlow, { n1: credentials }, () => {
      const n2 = helper.getNode('n2');

      n2.on('input', () => {
        n2.warn.should.be.calledWithExactly('homeeDevice.warning.value-exceeds-min-max 0 homeeDevice.warning.and 1');
        done();
      });

      n2.receive({
        payload: {
          attribute: {
            id: 1,
            value: 2,
          },
        },
      });
    });
  });

  it('should warn if the new value is below the min value', (done) => {
    helper.load([virtualHomeeNode, homeeDeviceNode], defaultFlow, { n1: credentials }, () => {
      const n2 = helper.getNode('n2');

      n2.on('input', () => {
        n2.warn.should.be.calledWithExactly('homeeDevice.warning.value-exceeds-min-max 0 homeeDevice.warning.and 1');
        done();
      });

      n2.receive({
        payload: {
          attribute: {
            id: 1,
            value: -1,
          },
        },
      });
    });
  });

  it('should update attributes target and current value', (done) => {
    helper.load([virtualHomeeNode, homeeDeviceNode], defaultFlow, { n1: credentials }, () => {
      const n2 = helper.getNode('n2');

      n2.on('input', () => {
        n2.attributes[0].target_value.should.equal(1);
        n2.attributes[0].current_value.should.equal(1);
        n2.attributes[0].last_changed.should.equal(Math.round(Date.now() / 1000));
        done();
      });

      n2.receive({
        payload: {
          attribute: {
            id: 1,
            value: 1,
          },
        },
      });
    });
  });

  it('should update the data property if provided', (done) => {
    helper.load([virtualHomeeNode, homeeDeviceNode], defaultFlow, { n1: credentials }, () => {
      const n2 = helper.getNode('n2');

      n2.on('input', () => {
        n2.attributes[0].data.should.equal('node-red');
        done();
      });

      n2.receive({
        payload: {
          attribute: {
            id: 1,
            data: 'node-red',
          },
        },
      });
    });
  });

  it('should update the status text on new values', (done) => {
    helper.load([virtualHomeeNode, homeeDeviceNode], defaultFlow, { n1: credentials }, () => {
      const n2 = helper.getNode('n2');

      n2.on('input', () => {
        n2.status.should.be.calledWithExactly({ fill: 'green', shape: 'dot', text: 'On' });
        done();
      });

      n2.receive({
        payload: {
          attribute: {
            id: 1,
            value: 1,
          },
        },
      });
    });
  });

  it('should allow a custom template for the status text', (done) => {
    helper.load([virtualHomeeNode, homeeDeviceNode], defaultFlow, { n1: credentials }, () => {
      const n2 = helper.getNode('n2');
      n2.statusTemplate = 'the current value of attribute {{ #1.id }} is {{ #1.current_value }}';

      n2.on('input', () => {
        n2.status.should.be.calledWithExactly({ fill: 'green', shape: 'dot', text: 'the current value of attribute 1 is 1' });
        done();
      });

      n2.receive({
        payload: {
          attribute: {
            id: 1,
            value: 1,
          },
        },
      });
    });
  });

  it('should output new values from homee as payload', (done) => {
    const flow = defaultFlow;
    flow.push({ id: 'n3', type: 'helper' });
    flow[0].wires = [['n3']];

    helper.load([virtualHomeeNode, homeeDeviceNode], flow, { n1: credentials }, () => {
      const n1 = helper.getNode('n1');
      const n3 = helper.getNode('n3');

      n1.api.emit('PUT:attributes', 1, 1, 1);

      n3.on('input', (msg) => {
        msg.should.have.property('payload', { attributeId: 1, targetValue: 1 });
        done();
      });
    });
  });
});
