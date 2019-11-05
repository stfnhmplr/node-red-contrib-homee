const should = require('should');
const helper = require('node-red-node-test-helper');
const virtualHomeeNode = require('../nodes/virtualHomee.js');

helper.init(require.resolve('node-red'));

describe('virtualHomee Node', () => {
  before((done) => helper.startServer(done));
  after((done) => helper.stopServer(done));
  afterEach(() => helper.unload());

  it('should be loaded', (done) => {
    const flow = [{ id: 'n1', type: 'virtualHomee', name: 'virtualHomee' }];

    helper.load(virtualHomeeNode, flow, { n1: { user: 'foo', pass: 'bar' } }, () => {
      const n1 = helper.getNode('n1');
      n1.should.have.property('name', 'virtualHomee');
      done();
    });
  });
});
