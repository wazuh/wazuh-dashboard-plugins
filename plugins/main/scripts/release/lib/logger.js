let minimumLevel = 1;

function setLevel(level) {
  minimumLevel = level;
}

function createLogLevel(tag, level, fn) {
  return function (message) {
    level >= minimumLevel && fn(`[${tag}]: ${message}`);
  };
}

module.exports = {
  info: createLogLevel('INFO', 2, console.log),
  warn: createLogLevel('WARN', 1, console.log),
  error: createLogLevel('ERROR', 2, console.log),
  debug: createLogLevel('DEBUG', 0, console.log),
  getLevel: () => minimumLevel,
  setLevel: setLevel,
};
