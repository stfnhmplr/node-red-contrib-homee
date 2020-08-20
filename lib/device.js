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
   * @param template {string}
   * @returns {string}
   */
  statusString(template) {
    if (template) {
      return template.replace(/{{\s*#(\d+)\.(\w+)\s*}}/g, (m, p1, p2) => {
        const attribute = this.attributes.find((a) => a.id === parseInt(p1, 10));
        return attribute && Object.prototype.hasOwnProperty.call(attribute, p2) ? attribute[p2] : '';
      });
    }

    return this.attributes.map((a) => {
      let str;

      switch (a.type) {
        case enums.CAAttributeType.CAAttributeTypeOnOff:
          str = ['Off', 'On'][a.current_value];
          break;
        case enums.CAAttributeType.CAAttributeTypeFirmwareRevision:
        case enums.CAAttributeType.CAAttributeTypeSoftwareRevision:
        case enums.CAAttributeType.CAAttributeTypeDeviceProgram:
          try {
            str = `${decodeURIComponent(a.data)}`.trim();
          } catch (e) { str = ''; }
          break;
        default:
          try {
            str = `${decodeURIComponent(a.unit)}`.trim();
          } catch (e) { str = ''; }
          str = `${a.current_value} ${str}`;
      }

      return str;
    }).join(', ');
  }
};
