module.exports = function(RED) {
    function HomeeApiNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;
        homee = RED.nodes.getNode(config.homee).homee;

        node.status({fill: 'red', shape: 'dot', text: 'disconnected'});

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
            node.send({ payload: message });
        })

        this.on('input', function(msg) {
            homee.send(msg.payload);
        });
    }

    RED.nodes.registerType('homeeApi', HomeeApiNode, {
        credentials: {
            user: {type: 'text'},
            pass: {type: 'password'}
        }
    });
}
