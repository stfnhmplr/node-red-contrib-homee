module.exports = function(RED) {
  function HomeeNode(config) {
    RED.nodes.createNode(this,config);
    var node = this;

    //this.homee = new Homee

    this.on('input', function(msg) {
      msg.payload = msg.payload.toLowerCase();
      node.send(msg);
    });
  }
  RED.nodes.registerType("homee", HomeeNode);
}
