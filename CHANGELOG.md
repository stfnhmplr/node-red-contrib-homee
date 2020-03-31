# Changelog

## [Unreleased]
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
