const EventEmitter = require('events');
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const Settings = require('./settings');
const { iequals, parse } = require('./helpers');

/**
 * class that handles the homee api
 */
class VirtualHomee extends EventEmitter {
  constructor(homeeId, credentials, node) {
    super();
    this.homeeId = homeeId;
    this.wss = new WebSocket.Server({ noServer: true });
    this.app = express();
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.server = http.createServer(this.app);
    this.username = credentials.user;
    this.password = crypto.createHash('sha512').update(credentials.pass).digest('hex');
    this.sockets = {};
    this.nextSocketId = 0;
    this.node = node;
    this.nodes = [];

    this.accessToken = credentials.accessToken;
  }

  stop() {
    return new Promise((resolve) => {
      this.server.close(() => resolve());
      Object.keys(this.sockets).forEach((socketId) => {
        this.sockets[socketId].destroy();
      });
    });
  }

  send(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  start() {
    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        this.node.error('Port 7681 is already in use. Please make sure that only one instance of the virtual homee is running.');
      } else {
        this.node.error(err);
      }
    });

    this.server.listen(7681, '0.0.0.0');
    this.server.on('upgrade', this.OnHttpServerUpgrade.bind(this));

    this.server.on('connection', (socket) => {
      // eslint-disable-next-line
      const socketId = this.nextSocketId++;
      this.sockets[socketId] = socket;

      // remove the socket when it closes
      socket.on('close', () => delete this.sockets[socketId]);
    });

    this.wss.on('connection', (ws) => {
      this.ws = ws;
      ws.on('message', (message) => {
        this.onWSMessage(message, ws);
      });
    });

    this.app.options('/access_token', (req, res) => {
      const header = {
        'Access-Control-Allow-Headers': 'Authorization',
        'Access-Control-Allow-Methods': 'POST, DELETE',
        'Access-Control-Allow-Origin': '*',
        'Content-Length': '0',
        'Content-Type': 'application/x-www-form-urlencoded',
        Server: 'virtualHomee Server',
      };
      res.writeHead(200, header);
      res.end();
    });

    this.app.post('/access_token', this.OnExpressPostAccessToken.bind(this));
  }

  setNodes(nodes) {
    this.nodes = nodes;
  }

  onWSMessage(message, ws) {
    const parsed = parse(message);

    this.emit(parsed.method, parsed);
    if (parsed.method === 'ping') {
      ws.send('pong');
    }
    if (iequals(parsed.method, 'get')) {
      if (iequals(parsed.target, 'nodes')) {
        if (parsed.commands.nodes === 0) {
          this.emit('GET:nodes', []);
          this.node.debug('nodes queried from client');
          ws.send(JSON.stringify({ nodes: this.nodes }));
        } else {
          this.emit('GET:nodes', parsed.commands.nodes);
        }
      }
      if (parsed.target === 'all') {
        this.emit('GET:all', []);
        ws.send(JSON.stringify({
          all:
        {
          nodes: this.nodes,
          users: [
            {
              id: 1,
              username: 'homee',
              forename: 'homee',
              surname: 'homee',
              image: '',
              role: 2,
              type: 1,
              email: '',
              phone: '',
              added: '27. Jan 2016 13:37:00 (1453898220)',
              homee_name: '🏠',
              homee_image: 'profileicon_5_1',
              access: 1,
              cube_push_notifications: 1,
              cube_email_notifications: 0,
              cube_sms_notifications: 0,
              node_push_notifications: 1,
              node_email_notifications: 0,
              node_sms_notifications: 0,
              warning_push_notifications: 1,
              warning_email_notifications: 0,
              warning_sms_notifications: 0,
              update_push_notifications: 1,
              update_email_notifications: 0,
              update_sms_notifications: 0,
              api_push_notifications: 0,
              api_email_notifications: 0,
              api_sms_notifications: 0,
            }],
          groups: [],
          relationships: [],
          homeegrams: [],
          settings: new Settings(this.homeeId),
          plans: [],
        },
        }));
      }
      if (parsed.target === 'settings') {
        this.emit('GET:settings', []);
        ws.send(JSON.stringify({
          settings:
          new Settings(this.homeeId),
        }));
      }
    }
    if (parsed.method === 'put') {
      if (parsed.target === 'attributes') {
        if (parsed.commands.attributes === 0) {
          parsed.parameters.ids.split(',').forEach((id) => {
            if (id !== '') {
              this.emit(
                'PUT:attributes',
                parseInt(id, 10),
                parseInt(parsed.commands.nodes, 10),
                parseFloat(parsed.parameters.target_value),
                parsed,
              );
            }
          });
        } else {
          this.emit(
            'PUT:attributes',
            parsed.commands.attributes,
            parsed.commands.nodes,
            parsed.parameters.target_value,
            parsed,
          );
        }
      }
    }
    if (parsed.method === 'post') {
      if (parsed.target === 'nodes') {
        const { protocol } = parsed.parameters;
        const check = parsed.parameters.compatibility_check;
        const version = parsed.parameters.my_version;
        const startPairing = parsed.parameters.start_pairing;
        if (protocol === '21') {
          if (check === '1') {
            // just echo back what homee wants to hear
             const payload = {
              compatibility_check: {
              compatible: true,
              account: true,
              external_homee_status: "none",
              your_version: true,
              my_version: version.replace(/ /g, '+'),
              my_homeeID: String(this.homeeID),
              },
            };
            ws.send(JSON.stringify(payload)
            );
          }
          if (startPairing === '1') {
            // just echo back what homee wants to hear
            ws.send(`${'{'
              + '    "pairing":{'
              + '        "access_token": "'}${this.accessToken}",`
              + '        "expires": 31536000,'
              + '        "userID": 1,'
              + '        "deviceID": 1'
              + '    }'
              + '}');
          }
        }
      }
    }
    if (parsed.method === 'delete') {
      if (parsed.target === 'devices') {
        ws.send('{\n'
          + '    "warning": {\n'
          + '        "code": 600,\n'
          + '        "description": "Your device got removed.",\n'
          + '        "message": "You have been logged out.",\n'
          + '        "data": {}\n'
          + '    }\n'
          + '}');
        ws.close(4444, 'DEVICE_DISCONNECT');
      }
    }
  }

  OnHttpServerUpgrade(request, socket, head) {
    const ParsedUrl = url.parse(request.url);
    const { pathname } = ParsedUrl;

    if (pathname === '/connection') {
      const params = new URLSearchParams(ParsedUrl.query);
      const GivenAccessToken = params.get('access_token');
      if (GivenAccessToken === this.accessToken) {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    } else {
      socket.destroy();
    }
  }

  OnExpressPostAccessToken(req, res) {
    // auth is in base64(username:password)  so we need to decode the base64
    const auth = req.headers.authorization;

    if (auth) { // The Authorization was passed in so now we validate it
      const tmp = auth.split(' '); // Split on a space, "Basic Y2hhcmxlczoxMjM0NQ=="

      // create a buffer and tell it the data coming in is base64
      // eslint-disable-next-line new-cap
      const Buf = new Buffer.from(tmp[1], 'base64');
      const PlainAuth = Buf.toString(); // read it back out as a string

      // At this point plain_auth = "username:password"

      const creds = PlainAuth.split(':'); // split on a ':'
      const username = creds[0];
      const password = creds[1];

      // eslint-disable-next-line max-len
      if (username === this.username && password === this.password) {
        // eslint-disable-next-line max-len
        this.node.debug('login successfull, sending access token');
        const response = `access_token=${this.accessToken}&user_id=1&device_id=1&expires=31536000`;
        res.writeHead(200, {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Access-Control-Allow-Origin': '*',
          Server: 'virtualHomee Server',
        });
        res.write(response);
        res.end();
      } else {
        res.statusCode = 401; // Force them to retry authentication
        res.writeHead(401, {
          'WWW-Authenticate': 'Basic realm="Secure Area"',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Access-Control-Allow-Origin': '*',
          Server: 'virtualHomee Server',
        });
        const response = ' {"errors":[{"status":"401","detail":"Invalid username or password.","blockTime": 2 }]}';
        res.write(response);
        res.end();
      }
    }
  }
}

module.exports = VirtualHomee;
