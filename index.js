const GDIWindow = require('./lib/GDIWindow');

const GDILib = {
  init (config) {
    return GDIWindow.init(config);
  }
};

module.exports = GDILib;
