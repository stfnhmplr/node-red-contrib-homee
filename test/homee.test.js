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
});
