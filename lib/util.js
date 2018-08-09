
module.exports = {
  isFloat (value) {
    return typeof value === 'number' && isFinite(value);
  },

  isInteger (value) {
    return Number.isInteger(value);
  },

  isBoolean (value) {
    return typeof value === 'boolean';
  },

  isArray (value) {
    return Array.isArray(value);
  },

  isString (value) {
    return typeof value === 'string' || ((!!value && typeof value === 'object') && Object.prototype.toString.call(value) === '[object String]');
  },

  isFunction (value) {
    return value && {}.toString.call(value) === '[object Function]';
  }
};
