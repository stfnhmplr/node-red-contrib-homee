module.exports = class Settings {
  constructor(homeeId) {
    this.address = '';
    this.city = '';
    this.zip = 11111;
    this.state = 'BW';
    this.latitude = '';
    this.longitude = '';
    this.country = 'Germany';
    this.language = 'de';
    this.wlan_dhcp = 1;
    this.remote_access = 1;
    this.beta = 0;
    this.webhooks_key = 'WEBHOOKKEY';
    this.automatic_location_detection = 0;
    this.polling_interval = 60;
    this.timezone = 'Europe%2FBerlin';
    this.enable_analytics = 0;
    this.wlan_enabled = 1;
    this.wlan_ip_address = '192.168.178.222';
    this.wlan_ssid = 'homeeWifi';
    this.wlan_mode = 2;
    this.online = 0;
    this.lan_enabled = 1;
    this.available_ssids = ['homeeWifi'];
    this.time = 1562707105;
    this.civil_time = '2019-07-09 23:18:25';
    this.version = "2.41.3+46ad073c";
    this.uid = homeeId;
    this.gateway_id = 1313337;
    this.cubes = [];
    this.extensions = {
      weather: {
        enabled: 1,
      },
      amazon_alexa: {
        enabled: 0,
      },
      google_assistant: {
        enabled: 0,
        syncing: 0,
      },
      apple_homekit: {
        enabled: 0,
        paired: 0,
        config_number: 1,
        syncing: 0,
      },
      ftp: {
        enabled: 0,
      },
      history: {
        enabled: 0,
      },
      backup: {
        enabled: 0,
      },
    };
  }
};
