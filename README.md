# node-red-contrib-homee

> access the homee api with node-red


## Installation
```
cd ~/.node-red
npm install node-red-contrib-homee
```

## Usage
The node creates a websocket connection to homee. First set the IP, username and password in the configuration of the node.

### Receiving messages
When the connection is successfully established, all messages from homee, e.g. status updates and user interactions, are passed on to the payload.

### Sending messages
homee accepts varoius messages in a particular format. Send the message as payload to the homee node. Below are a few examples of common messages.

#### Get all nodes
```
GET:nodes
```

#### Get all homeegrams
```
GET:homeegrams
```

#### Get all groups
```
GET:groups
```

#### Get all relationsships
```
GET:relationships
```

## About
This plugin is not an official plugin.
