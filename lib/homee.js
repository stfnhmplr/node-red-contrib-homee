/**
 * created by stfnhmplr on 11.01.17
 * control your Homee via websocket with node.js
 */
const WebSocket = require("ws");
const hash = require("crypto-toolkit").Hash("hex");
const request = require("request");

const Homee = function(host, user, pass) {
    this.host = host;
    this.user = user;
    this.pass = pass;
    this.ws = null;
    this.token = '';
    this.expires = '';
    this.connected = false;
};


/**
 * retrieve access token
 * @type {Promise}
 */
Homee.prototype.getAccessToken = function() {
    let that = this;

    let options = {
        url: "http://" + this.host + ":7681/access_token",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        form: {
            device_name: "homebridge",
            device_hardware_id: "homebridge",
            device_os: 5, // Linux
            device_type: 3, // Desktop
            device_app: 1 // homee
        },
        auth: {
            user: this.user,
            pass: hash.sha512(this.pass)
        }
    };

    return new Promise(function(resolve, reject) {
        if (that.token && that.expires > Date.now()) resolve(that.token);

        request.post(options, function(err, res, body) {
            if (!err) {
                that.token = body.split("&")[0].split("=")[1];
                that.expires = Date.now() + parseInt(body.split("&")[3].split("=")[1]);
                resolve(that.token);
            } else {
                reject(new Error("Homee: Error while receiving AccessToken: " + err));
            }
        });
    });
};


/**
 * Establish websocket connection
 * @type {Promise}
 */
Homee.prototype.connect = function() {
    let that = this;

    return new Promise(function(resolve, reject) {
        that.getAccessToken()
            .then((token) => {
                that.ws = new WebSocket(
                    "ws://" +
                        that.host +
                        ":7681/connection?access_token=" +
                        token,
                    {
                        protocol: "v2",
                        protocolVersion: 13,
                        origin: "http://" + that.host + ":7681"
                    },
                    function(err) {
                        reject(new Error ("Can't connect to homee ws" + err));
                    }
                );

                that.ws.on("open", function open() {
                    that.connected = true;
                    that.startHeartbeatHandler();
                    resolve();
                });
            })
            .catch(function(err) {
                reject(err);
            });
    });
};


/**
 * Listen to messages of homee
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
Homee.prototype.listen = function(callback) {
    this.ws.on('message', function(message) {
        callback(JSON.parse(message));
    });
};


/**
 * sends a message via websocket
 * @param  {String} message the message, i.e. 'GET:nodes'
 */
Homee.prototype.send = function(message) {
    this.ws.send(message);
};


/**
 * Heartbeathandler to detect connection status
 */
Homee.prototype.startHeartbeatHandler = function () {
    let that = this;

    this.ws.on('pong', function () {
        that.connected = true;
    });

    setInterval(function ping() {
        if (that.ws && that.connected === false) that.reconnect();
        that.connected = false;
        that.ws.ping('', false, true);
    }, 30000);
}


/**
 * connects again after connection is lost
 */
Homee.prototype.reconnect = function () {
    this.ws.terminate();
    this.connect().then(() => {
        //connected
    }).catch(err => {
        this.connected = false;
    });
}

module.exports = Homee;
