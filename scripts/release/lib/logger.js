function createLogger(pathTags = null, minimumLoglevel = 1) {
  let minimumLevel = minimumLoglevel;
  let _path = pathTags;

  function setLevel(level) {
    minimumLevel = level;
  }

  function createLogLevel(levelTag, level, fn) {
    const pathTag = [levelTag, ...(_path || [])]
      .map(str => `[${str}]`)
      .join('');
    return function (message) {
      level >= minimumLevel && fn(`${pathTag}: ${message}`);
    };
  }
  return {
    info: createLogLevel('INFO', 2, console.log),
    warn: createLogLevel('WARN', 1, console.log),
    error: createLogLevel('ERROR', 2, console.log),
    debug: createLogLevel('DEBUG', 0, console.log),
    getLevel: () => minimumLevel,
    setLevel: setLevel,
    create: createLogger,
    _path,
  };
}

module.exports = createLogger();
