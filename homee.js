var Homee = require('homee-api');

module.exports = function(RED) {
    function HomeeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var homee = new Homee(config.host, this.credentials.user, this.credentials.pass);

        homee.connect().then(function () {
            node.log('connected to homee');
            node.status({fill: 'green', shape: 'dot', text: 'connected'});
        }).catch(function (err) {
            node.log.error(err);
            node.status({fill: 'red', shape: 'dot', text: 'error'});
        });

        homee.on('message', function (message) {
            node.send({ payload: message });
        })

        this.on('input', function(msg) {
            homee.send(msg.payload);
        });

        this.on('close', function () {
            homee.disconnect();
            node.status({fill: 'red', shape: 'dot', text: 'not connected'});
            node.log('homee: connection closed')
        });
    }

    RED.nodes.registerType("homee", HomeeNode, {
        credentials: {
            user: {type:"text"},
            pass: {type:"password"}
        }
    });
}
