// eslint-disable-next-line
const sinon = require('sinon');
const helper = require('node-red-node-test-helper');
const homeeNode = require('../nodes/homee.js');

helper.init(require.resolve('node-red'));

describe('homee Node', () => {
  before((done) => helper.startServer(done));
  after((done) => helper.stopServer(done));
  afterEach(() => helper.unload());

  // eslint-disable-next-line
  const defaultFlow = [{ id: 'n1', type: 'homee', name: 'homee', device: 'NodeRedTest' }];

  it('should be loaded', (done) => {
    helper.load(homeeNode, defaultFlow, () => {
      const n1 = helper.getNode('n1');
      n1.should.have.property('name', 'homee');
      done();
    });
  });

  it('should store data in the global context if configured', (done) => {
    const flow = JSON.parse(JSON.stringify(defaultFlow));
    flow[0].globalContext = true;

    helper.load(homeeNode, flow, () => {
      const n1 = helper.getNode('n1');
      n1.homee.handleMessage({
        all: {
          nodes: [{ id: 1 }],
          groups: [{ id: 2 }],
          relationships: [{ id: 3 }],
          plans: [{ id: 4 }],
        },
      });
      n1.context().global.get('homee.nodes').should.be.eql([{ id: 1 }]);
      n1.context().global.get('homee.groups').should.be.eql([{ id: 2 }]);
      n1.context().global.get('homee.relationships').should.be.eql([{ id: 3 }]);
      n1.context().global.get('homee.plans').should.be.eql([{ id: 4 }]);
      done();
    });
  });

  it('should set a custom device id', (done) => {
    helper.load(homeeNode, defaultFlow, () => {
      const n1 = helper.getNode('n1');
      n1.homee.should.have.property('deviceId', 'node-red-test');
      done();
    });
  });

  it('should close the connection to homee if the node closes', (done) => {
    helper.load(homeeNode, defaultFlow, () => {
      const n1 = helper.getNode('n1');
      const homeeDisconnect = sinon.spy(n1.homee, 'disconnect');

      n1.close();
      homeeDisconnect.should.be.called();
      done();
    });
  });
});
