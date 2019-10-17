var Homee = require('homee-api');

module.exports = function(RED) {
    function HomeeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        this.homee = new Homee(config.host, this.credentials.user, this.credentials.pass, {
            device: 'Node-RED',
            reconnect: true,
            reconnectInterval: 5000,
            maxRetries: Infinity
        });

        this.homee.on('message', function (message) {
            node.context().global.set('homee.nodes', node.homee.nodes);
            node.context().global.set('homee.groups', node.homee.groups);
            node.context().global.set('homee.attributes', node.homee.attributes)
        })

        this.homee.on('error', function (err) {
            node.log(err);
        })

        this.homee.connect().then(function () {
            node.log('connected to homee');
        }).catch(function (err) {
            node.log.error(err);
        });

        this.on('input', function(msg) {
            homee.send(msg.payload);
        });

        this.on('close', function () {
            homee.disconnect();
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
