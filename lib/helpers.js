/**
 * compares two string, case insensitive
 * @param {*} a
 * @param {*} b
 * @return {bool} true if equal, false otherwise
 */
function iequals(a, b) {
  return typeof a === 'string' && typeof b === 'string'
    ? a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
    : a === b;
}

/**
 * parses a message from homee
 * @param  {string} message
 * @return {Object}         [description]
 */
function parse(message) {
  // "put:nodes/1/attributes/1?target_value=1"
  if (message.indexOf(':') === -1) {
    // special commands
    if (iequals(message, 'ping')) {
      return {
        method: 'ping', commands: '', target: '', parameters: {},
      };
    }
  }

  // eslint-disable-next-line prefer-const
  let [method, a] = message.split(':');
  method = method.toLowerCase();
  const [commands, parameters] = a.split('?');
  let c;
  const cmds = {};
  let targetCmd;

  // eslint-disable-next-line
  for (const t of commands.split('/')) {
    // eslint-disable-next-line
    if (isNaN(t)) {
      c = t.toLowerCase();
      // eslint-disable-next-line
      continue;
    }
    cmds[c] = t;
    targetCmd = c.toLowerCase();
    c = '';
  }

  if (c !== '') {
    targetCmd = c;
    cmds[c.toLowerCase()] = 0;
  }
  if (!targetCmd) {
    // in case there are no parameter or anything (like get:nodes)
    targetCmd = commands.toLowerCase();
    cmds[commands.toLowerCase()] = 0;
  }
  const searchParams = new URLSearchParams(parameters);

  const paras = {};
  searchParams.forEach((value, key) => {
    paras[key.toLowerCase()] = value;
  });

  return {
    method, commands: cmds, target: targetCmd, parameters: paras,
  };
}

/**
 * @param  {Function} callback function to execute
 * @param  {number}   wait     time in milliseconds
 * @return {Function}
 */
function debounce(callback, wait) {
  let timeout;
  return (...args) => {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => callback.apply(context, args), wait);
  };
}

module.exports = { iequals, parse, debounce };
