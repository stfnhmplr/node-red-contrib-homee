// eslint-disable-next-line
const sinon = require('sinon');
const helper = require('node-red-node-test-helper');
const homeeNode = require('../nodes/homee.js');

helper.init(require.resolve('node-red'));

describe('homee Node', () => {
  before((done) => helper.startServer(done));
  after((done) => helper.stopServer(done));
  afterEach(() => helper.unload());

  it('should be loaded', (done) => {
    const flow = [{ id: 'n1', type: 'homee', name: 'homee' }];

    helper.load(homeeNode, flow, () => {
      const n1 = helper.getNode('n1');
      n1.should.have.property('name', 'homee');
      done();
    });
  });

  it('should store data in the global context if configured', (done) => {
    // eslint-disable-next-line
    const flow = [{ id: 'n1', type: 'homee', name: 'homee', globalContext: true }];

    helper.load(homeeNode, flow, () => {
      const n1 = helper.getNode('n1');
      n1.homee.handleMessage({
        all: {
          nodes: [{ id: 1 }],
          groups: [{ id: 2 }],
          relationships: [{ id: 3 }],
        },
      });
      n1.context().global.get('homee.nodes').should.be.eql([{ id: 1 }]);
      n1.context().global.get('homee.groups').should.be.eql([{ id: 2 }]);
      n1.context().global.get('homee.relationships').should.be.eql([{ id: 3 }]);
      done();
    });
  });

  it('should close the connection to homee if the node closes', (done) => {
    const flow = [{ id: 'n1', type: 'homee', name: 'homee' }];

    helper.load(homeeNode, flow, () => {
      const n1 = helper.getNode('n1');
      const homeeDisconnect = sinon.spy(n1.homee, 'disconnect');

      n1.close();
      homeeDisconnect.should.be.called();
      done();
    });
  });
});
