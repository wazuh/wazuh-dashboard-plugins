const createMockLogger = () => {
  const noop = () => {};
  const logger = {
    info: noop,
    error: noop,
    debug: noop,
    warn: noop,
    trace: noop,
    fatal: noop,
    log: noop,
    get: () => logger,
  };

  return logger;
};

export { createMockLogger };
