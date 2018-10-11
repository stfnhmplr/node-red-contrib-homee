var Homee = require('homee-api');

module.exports = function(RED) {
    function HomeeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.status({fill: 'red', shape: 'dot', text: 'disconnected'});

        var homee = new Homee(config.host, this.credentials.user, this.credentials.pass, {
            device: 'Node-RED',
            reconnect: true,
            reconnectInterval: 5000,
            maxRetries: Infinity
        });

        homee.on('connected', function () {
            node.status({fill: 'green', shape: 'dot', text: 'connected'});
        });

        homee.on('disconnected', function () {
            node.status({fill: 'red', shape: 'dot', text: 'disconnected'});
        })

        homee.on('reconnect', function () {
            node.status({fill: 'yellow', shape: 'dot', text: 'reconnecting...'})
        })

        homee.on('message', function (message) {
            node.context().global.set('homee.nodes', homee.nodes);
            node.context().global.set('homee.groups', homee.groups);
            node.send({ payload: message });
        })

        homee.on('error', function (err) {
            node.log(err);
        })

        homee.connect().then(function () {
            node.log('connected to homee');
        }).catch(function (err) {
            node.log.error(err);
            node.status({fill: 'red', shape: 'dot', text: 'error'});
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
