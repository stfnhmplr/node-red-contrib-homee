// eslint-disable-next-line
module.exports = function (RED) {
  function logToCollection(log) {
    // eslint-disable-next-line
    const regex = /(?:\[([\d,-]{10} [\d,:]{8})\.\d{3}\])?(?: \[([a-zA-Z0-9_,\-]+)\] )?\[([a-z]+)\](.*)/;

    return log.replace(/\n•/gm, '').split('\n').map((r) => {
      const matches = regex.exec(r);
      const [, datetime, topic, level, message] = matches || [
        undefined,
        undefined,
        undefined,
        undefined,
        r,
      ];

      return {
        datetime,
        topic,
        level,
        message,
      };
    });
  }

  function HomeeLogNode(config) {
    RED.nodes.createNode(this, config);

    const { homee } = RED.nodes.getNode(config.homee);

    this.on('input', (msg) => {
      this.status({ fill: 'yellow', shape: 'dot', text: RED._('homeeLog.status.query') });
      homee.getLog().then((log) => {
        switch (msg.output || config.output) {
          case 'array':
            this.send({ payload: log.replace(/\n•/gm, '').split('\n') });
            break;
          case 'collection':
            this.send({ payload: logToCollection(log) });
            break;
          default:
            this.send({ payload: log });
            break;
        }
        this.status({});
      }).catch((error) => {
        this.status({ fill: 'red', shape: 'dot', text: RED._('homeeLog.status.error') });
        this.send({ error });
      });
    });
  }

  RED.nodes.registerType('homeeLog', HomeeLogNode);
};
