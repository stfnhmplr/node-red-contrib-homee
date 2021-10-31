# Changelog

## [0.10.0] - 2021-10-31
## Changed
- Updated icons

## [0.11.0] - 2021-08-27
## Added
- New homeeLogNode: Query the logfile from your homee and select between three different output formats.
## Changed
- Bugfix: Infinity and NaN are now not longer valid id or values when sending a message to a homee device

## [0.10.0] - 2021-06-20
## Added
- Current and target value can now be set seperately from each other.
- The access token of your virtual homee can now be renewed from the Node-RED editor.

## [0.9.0] - 2021-04-28
## Changed
- Some input fields have been replaced by typed inputs to allow the use of environment variables. Thus, subflows can now be used for device definition.
- In the Api Node it is now possible to filter for messages about plans and homeegrams. In addition, plans and homeegrams are now also stored in the global context if configured.

## [0.8.2] - 2021-04-18
## Changed
- Bugfix for Node-RED >= v. 1.3.0

## [0.8.1] - 2020-10-12
## Changed
- Since version 2.31.0 homee allows only one connection per device. For the use of multiple Node-RED instances, a unique device name can now be specified.

## [0.8.0] - 2020-11-04
## Added
- Attributes can now be sorted. Ids will be automatically adjusted when sorting.
- Added `name` param to new attributes.
- Validation for instances on attributes with the same type
### Changed
- The `data` attribute can now be updated without specifying a `value`.
- The attribute type can now be set individually using the expert mode.
- Removed deprecated syntax for changing attributes

## [0.7.1] - 2020-09-28
### Changed
- Fixed some typos
- Fixed broken api urls when node-red does not run at root path
- Disabled export of the homee-api configuration node

## [0.7.0] - 2020-09-06
### Added
- Added german translation
- homeeApi node: added filter options for outgoing messages
- homeeDevice node: allow a custom template for the nodes status text
- homeeDevice node: New attribute list for easier attribute definition
- homeeDevice node: Attribute templates
### Changed
- Fixed: For attribute types FirmwareRevision, SoftwareRevision and DeviceProgramm the data attribute is used instead of the current value.
- fixed icon size and switched from png to svg
- homeeApi node: Changed icon for configuration node

## [0.6.0] - 2020-06-04
### Added
- Added relationships (node <--> group) to global context
- Added option to disable the distribution to the global context
- Add option to change data in device-attribute (PR #10)

## [0.5.3] - 2020-04-22
### Changed
- Bugfix: Prevent crashing due missing contextStorage configuration

## [0.5.2] - 2020-04-21
### Changed
- catch invalid units in attributes (#9)
- store and load attribute data only if the `homeeStore` is configured
- wait until the context is set before closing the node

## [0.5.1] - 2020-04-18
### Changed
- readded `data` key to attributes since this affects the status shown in homee
- fixed `last_value`

## [0.5.0] - 2020-04-18
### Added
- Added Changelog. All notable changes to this project will be documented in this file
- Messages for updating an attribute value can now be arrays. This allows multiple attribute values to be changed at once.
- Optionally persist attribute values in a new homeeStore. Locale file system must be enabled in `settings.js`
- Option to display the Node-ID at the title of the node

### Changed
- The node status now shows the current values of its attributes instead of `registered`
- Messages are not longer ignored if they are sent within 10 seconds
- Shortened the virtual homee label at the device configuration page
- Removed `data` from attribute update messages to prevent changes during runtime
