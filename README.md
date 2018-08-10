# node-red-contrib-homee

> access the homee api with node-red

## Installation
```
cd ~/.node-red
npm install node-red-contrib-homee
```

Alternatively you could use [**homeean**](https://homeean.de) to install node-red-contrib-homee (including Node-RED) on a Raspberry Pi with a plain vanilla Raspbian installation. homeean is a web based buildtool, which generates an individual buildscript (Bash-Script) for user selected Smart Home Tools to be installed on a Raspberry Pi running on Raspbian. node-red-contrib-homee (including its dependecy Node-RED) is provided as an homeean install option.

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
