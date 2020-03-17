const enums = require('homee-api/lib/enums');

module.exports = class Device {
  constructor(name, id, profile, attributes, icon) {
    this.name = name;
    this.id = id;
    this.profile = profile;
    this.image = icon;
    this.favorite = 0;
    this.order = id;
    this.protocol = 1;
    this.routing = 1;
    this.state = 1;
    this.state_changed = 12345;
    this.added = 12345;
    this.history = 0;
    this.cube_type = 1;
    this.note = '';
    this.services = 0;
    this.phonetic_name = '';
    this.owner = 0;
    this.denied_user_ids = [];
    this.attributes = attributes;
  }

  /**
   * joins attribute values and units to string
   * @returns {string}
   */
  statusString() {
    return this.attributes.map((a) => {
      if (a.type === enums.CAAttributeType.CAAttributeTypeOnOff) return ['Off', 'On'][a.current_value];
      return `${a.current_value} ${a.unit}`.trim();
    }).join(', ');
  }
};
