// eslint-disable-next-line
const should = require('should');
// eslint-disable-next-line
const sinon = require('sinon');
const helper = require('node-red-node-test-helper');
const homeeNode = require('../nodes/homee.js');
const homeeApiNode = require('../nodes/homee-api.js');

helper.init(require.resolve('node-red'));

describe('homeeApi Node', () => {
  before((done) => helper.startServer(done));
  after((done) => helper.stopServer(done));
  afterEach(() => helper.unload());

  // eslint-disable-next-line
  const defaultFlow = [{ id: 'n1', type: 'homee', name: 'homee', host: '192.168.178.109', globalContext: false }, { id: 'n2', type: 'homeeApi', homee: 'n1', name: 'homeeApi' }];

  it('should be loaded', (done) => {
    helper.load([homeeApiNode, homeeNode], defaultFlow, () => {
      const n2 = helper.getNode('n2');
      n2.should.have.property('name', 'homeeApi');
      done();
    });
  });

  it('should have the correct initial status', (done) => {
    helper.load([homeeApiNode, homeeNode], defaultFlow, () => {
      const n2 = helper.getNode('n2');

      n2.status.should.be.calledWithExactly({ fill: 'red', shape: 'dot', text: 'node-red:common.status.not-connected' });
      done();
    });
  });

  it('should update the status when it connects', (done) => {
    helper.load([homeeApiNode, homeeNode], defaultFlow, () => {
      const n1 = helper.getNode('n1');
      const n2 = helper.getNode('n2');

      n1.homee.emit('connected');
      n2.status.should.be.calledWithExactly({ fill: 'green', shape: 'dot', text: 'node-red:common.status.connected' });
      done();
    });
  });

  it('should update the status when it disconnects', (done) => {
    helper.load([homeeApiNode, homeeNode], defaultFlow, () => {
      const n1 = helper.getNode('n1');
      const n2 = helper.getNode('n2');

      n1.homee.emit('disconnected');
      n2.status.should.be.calledWithExactly({ fill: 'red', shape: 'dot', text: 'node-red:common.status.disconnected' });
      done();
    });
  });

  it('should update the status when it reconnects', (done) => {
    helper.load([homeeApiNode, homeeNode], defaultFlow, () => {
      const n1 = helper.getNode('n1');
      const n2 = helper.getNode('n2');

      n1.homee.emit('reconnect');
      n2.status.should.be.calledWithExactly({ fill: 'yellow', shape: 'dot', text: 'node-red:common.status.connecting' });
      done();
    });
  });

  it('should output messages from homee as payload', (done) => {
    const flow = JSON.parse(JSON.stringify(defaultFlow));
    flow.push({ id: 'n3', type: 'helper' });
    flow[1].wires = [['n3']];

    helper.load([homeeApiNode, homeeNode], flow, () => {
      const n1 = helper.getNode('n1');
      const n3 = helper.getNode('n3');

      n3.on('input', (msg) => {
        msg.should.have.property('payload', 'test');
        done();
      });

      n1.homee.emit('message', 'test');
    });
  });

  it('should deliver incoming messages to homee', (done) => {
    helper.load([homeeApiNode, homeeNode], defaultFlow, () => {
      const n1 = helper.getNode('n1');
      const n2 = helper.getNode('n2');

      const homeeSend = sinon.spy(n1.homee, 'send');

      n2.on('input', () => {
        homeeSend.should.be.calledWithExactly('GET:NODES');
        done();
      });

      n2.receive({ payload: 'GET:NODES' });
    });
  });

  it('should filter messages by type if configured', (done) => {
    const flow = JSON.parse(JSON.stringify(defaultFlow));
    flow.push({ id: 'n3', type: 'helper' });
    flow[1].wires = [['n3']];
    flow[1].messageTypeFilter = ['warning'];

    helper.load([homeeApiNode, homeeNode], flow, () => {
      const n1 = helper.getNode('n1');
      const n3 = helper.getNode('n3');
      let count = 0;

      n3.on('input', (msg) => {
        count += 1;
        if (count > 1) should.fail(null, null, 'unexpected message');
        msg.payload.should.have.property('warning', 'some warning message');
        done();
      });

      n1.homee.emit('message', { attribute: { id: 1 } });
      n1.homee.emit('message', { warning: 'some warning message' });
    });
  });

  it('should filter messages of type node by node id if configured', (done) => {
    const flow = JSON.parse(JSON.stringify(defaultFlow));
    flow.push({ id: 'n3', type: 'helper' });
    flow[1].wires = [['n3']];
    flow[1].nodeFilter = 1;

    helper.load([homeeApiNode, homeeNode], flow, () => {
      const n1 = helper.getNode('n1');
      const n3 = helper.getNode('n3');
      let count = 0;

      n3.on('input', (msg) => {
        count += 1;
        if (count > 1) should.fail(null, null, 'unexpected message');
        msg.payload.should.have.property('node', { id: 1 });
        done();
      });

      n1.homee.emit('message', { node: { id: 2 } });
      n1.homee.emit('message', { node: { id: 1 } });
    });
  });

  it('should filter messages of type attribute by node id if configured', (done) => {
    const flow = JSON.parse(JSON.stringify(defaultFlow));
    flow.push({ id: 'n3', type: 'helper' });
    flow[1].wires = [['n3']];
    flow[1].nodeFilter = 1;

    helper.load([homeeApiNode, homeeNode], flow, () => {
      const n1 = helper.getNode('n1');
      const n3 = helper.getNode('n3');
      let count = 0;

      n3.on('input', (msg) => {
        count += 1;
        if (count > 1) should.fail(null, null, 'unexpected message');
        msg.payload.should.have.property('attribute', { id: 1, node_id: 1 });
        done();
      });

      n1.homee.emit('message', { attribute: { id: 1, node_id: 2 } });
      n1.homee.emit('message', { attribute: { id: 1, node_id: 1 } });
    });
  });

  it('should filter messages by attribute id if configured', (done) => {
    done();
  });

  it('should filter messages of type attribute by attribute id if configured', (done) => {
    const flow = JSON.parse(JSON.stringify(defaultFlow));
    flow.push({ id: 'n3', type: 'helper' });
    flow[1].wires = [['n3']];
    flow[1].attributeFilter = 1;

    helper.load([homeeApiNode, homeeNode], flow, () => {
      const n1 = helper.getNode('n1');
      const n3 = helper.getNode('n3');
      let count = 0;

      n3.on('input', (msg) => {
        count += 1;
        if (count > 1) should.fail(null, null, 'unexpected message');
        msg.payload.should.have.property('attribute', { id: 1 });
        done();
      });

      n1.homee.emit('message', { attribute: { id: 2 } });
      n1.homee.emit('message', { attribute: { id: 1 } });
    });
  });
});
