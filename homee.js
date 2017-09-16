var Homee = require('./lib/homee.js');

module.exports = function(RED) {
    function HomeeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var homee = new Homee(config.host, this.credentials.user, this.credentials.pass);

        homee.connect().then(function () {
            node.log('connected to homee');
            node.status({fill: 'green', shape: 'dot', text: 'connected'});
            homee.listen(function (message) {
                node.send({
                    payload: message
                });
            });
        }).catch(function (err) {
            node.log.error(err);
            node.status({fill: 'red', shape: 'dot', text: 'error'});
        });

        this.on('input', function(msg) {
            homee.send(msg.payload);
        });

        this.on('close', function () {
            homee.disconnect();
        });
    }

    RED.nodes.registerType("homee", HomeeNode, {
        credentials: {
            user: {type:"text"},
            pass: {type:"password"}
        }
    });
}
