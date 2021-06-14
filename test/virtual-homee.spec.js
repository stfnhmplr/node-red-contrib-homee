const helper = require('node-red-node-test-helper');
const virtualHomeeNode = require('../nodes/virtual-homee.js');
const homeeDeviceNode = require('../nodes/homee-device.js');

helper.init(require.resolve('node-red'), {
  contextStorage: {
    default: {
      module: 'memory',
    },
    homeeStore: {
      module: 'localfilesystem',
    },
  },
});

const credentials = { n1: { user: 'foo', pass: 'bar' } };

describe('virtualHomee Node', () => {
  before((done) => helper.startServer(done));
  after((done) => helper.stopServer(done));
  afterEach(() => helper.unload());

  it('should be loaded with correct defaults', (done) => {
    const flow = [{ id: 'n1', type: 'virtualHomee', name: 'virtualHomee' }];

    helper.load(virtualHomeeNode, flow, credentials, () => {
      const n1 = helper.getNode('n1');
      n1.should.have.property('name', 'virtualHomee');
      n1.devices[0].should.have.property('id', -1);
      done();
    });
  });

  it('should replace devices with the same id', (done) => {
    const flow = [{ id: 'n1', type: 'virtualHomee', name: 'virtualHomee' }];

    helper.load(virtualHomeeNode, flow, credentials, () => {
      const n1 = helper.getNode('n1');
      const device = {
        id: 1,
        name: 'OldDevice',
        attributes: [{
          id: 1,
        }],
      };

      n1.registerDevice(1, device, () => {
        device.name = 'NewDevice';
        n1.registerDevice(1, device, () => {
          n1.devices[1].should.have.property('name', 'NewDevice');
          done();
        });
      });
    });
  });

  it('should return an error when attribute ids are not unique', (done) => {
    const flow = [{ id: 'n1', type: 'virtualHomee', name: 'virtualHomee' }];

    helper.load(virtualHomeeNode, flow, credentials, () => {
      const n1 = helper.getNode('n1');
      const firstDevice = { id: 1, attributes: [{ id: 1 }] };
      const secondDevice = { id: 2, attributes: [{ id: 1 }] };

      n1.registerDevice(firstDevice.id, firstDevice, () => {
        n1.registerDevice(secondDevice.id, secondDevice, (err) => {
          err.should.equal('virtualHomee.error.attributes-not-unique');
          done();
        });
      });
    });
  });

  it('should update device attributes on change', (done) => {
    // eslint-disable-next-line
    const flow = [{id: 'n2', type :"homeeDevice", 'virtual-homee': 'n1', name: 'TestDevice', nodeId: '1', 'showNodeId': true, profile: '10', icon: 'default', attributes: '[{"id": 1, "node_id": 1, "instance": 0, "minimum": 0, "maximum": 1, "current_value": 0, "target_value": 0, "last_value": 0, "unit": "", "step_value": 1, "editable": 1, "type": 1, "state": 1, "last_changed": 1572944008, "changed_by": 0, "changed_by_id": 0, "based_on": 1, "data": ""}]'}, {id: 'n1', type: 'virtualHomee', name: 'virtualHomee'}];

    helper.load([virtualHomeeNode, homeeDeviceNode], flow, credentials, () => {
      const n1 = helper.getNode('n1');
      const n2 = helper.getNode('n2');

      n1.api.emit('PUT:attributes', 1, 1, 1);
      n2.attributes[0].should.have.property('target_value', 1);
      n2.attributes[0].should.have.property('current_value', 1);
      done();
    });
  });

  it('should return homee enums on api request', (done) => {
    const flow = [{ id: 'n1', type: 'virtualHomee', name: 'virtualHomee' }];

    helper.load(virtualHomeeNode, flow, credentials, async () => {
      helper.request()
        .get('/homee-api/enums')
        .expect(200)
        .end((err, res) => {
          if (err) throw err;

          res.body.should.have.property('CANodeProfile');
          done();
        });
    });
  });

  it('should return node icons on api request', (done) => {
    const flow = [{ id: 'n1', type: 'virtualHomee', name: 'virtualHomee' }];

    helper.load(virtualHomeeNode, flow, credentials, async () => {
      helper.request()
        .get('/homee-api/icons')
        .expect(200)
        .end((err, res) => {
          if (err) throw err;

          res.body.should.have.property('default', 'default');
          done();
        });
    });
  });

  it('should update the access token on api request', (done) => {
    const flow = [{ id: 'n1', type: 'virtualHomee', name: 'virtualHomee' }];

    credentials.n1.accessToken = 'oldToken';

    helper.load(virtualHomeeNode, flow, credentials, async () => {
      helper.request()
        .post('/homee-api/renew-token')
        .send({ id: 'n1' })
        .expect(200)
        .end((err) => {
          if (err) throw err;

          const [[logEntry]] = helper.log().args.filter((e) => e[0].msg === 'virtualHomee.info.token-renewed');
          logEntry.should.have.property('msg', 'virtualHomee.info.token-renewed');
          done();
        });
    });
  });
});
