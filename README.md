# node-red-contrib-homee

Access the homee api with node-red and create virtual devices for homee.

## Installation
```
cd ~/.node-red
npm install node-red-contrib-homee
```

## Usage

This plugin provides two nodes (and two configuration nodes). The homeeApi-node
is used to address the API of an existing homee. With the homeeDevice-node you
can create virtual devices for your homee.

### homeeAPI

#### Receiving messages
When the connection is successfully established, all messages from homee, e.g. status updates and user interactions, are passed on to the payload.

#### Sending messages
homee accepts various messages in a particular format. Send the message as payload to the homee node. Below are a few examples of common messages.

##### Get all nodes
```
GET:nodes
```

##### Get all homeegrams
```
GET:homeegrams
```

##### Get all groups
```
GET:groups
```

##### Get all relationsships
```
GET:relationships
```

### homeeDevice
First a virtualHomee-node (like an virtual homee) must be configured. Afterwards any
device that homee knows can be created. The devices can then be taught-in
using the homee in homee function. Every homeeDevice-node provides one input and
one output.

#### Input from flow
You can change attribute values by sending a JSON object as payload to the
homeeDevice-node. The example sets the attribute with the ID `10` to the value `1`.

```json
{
  "attribute": {
      "id": 10,
      "value": 1
  }
}
```
**Hint**: The old syntax `{"id": 10, "value": 1}` still works but is deprecated and will be removed in one of the next versions.

It's also possible to update the state of the node. The following example sets the state of the virtual device to unavailable.
```json
{ "state": 2 }
```

#### Flow output
Every attribute change from homee sends a json payload to the output of the node.

```json
{ "attributeId": 10, "targetValue": 0 }
```

#### Sample flows
The [homeean](https://github.com/homeean) project provides a collection of [sample flows](https://github.com/homeean/node-red-contrib-homee-flows), including fully-configured `virtualDevice-node`'s that can serve as a starting point for your own flows.

#### Profile and Attribute type values
Each `virtualDevice-node` needs a specific `profile` value and each of the node's attributes a `type`. Known values can be found in the [homee-api](https://github.com/stfnhmplr/homee-api/) project's [`enum.js`](https://github.com/stfnhmplr/homee-api/blob/master/lib/enums.js).

#### Persist attribute data
By default, Node-RED does not save changes to nodes that are executed in the background. This includes
changes to the current value of an attribute.

With version 0.5.0 an optional storage possibility of attribute values is introduced.
In order to use the storage option, the local file storage must be enabled in `settings.js`.

```js
contextStorage: {
  default: {
        module: "memory",
      },
   homeeStore: {
       module: "localfilesystem",
   }
},
```

## About
This plugin is not an official plugin. The homee device simulation is based on
the work of @tobiasgraf and his [homeejs](https://github.com/tobiasgraf/homeejs)
and would not have been possible without him.
