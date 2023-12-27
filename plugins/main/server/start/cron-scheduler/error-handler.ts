const DEBUG = 'debug';
const INFO = 'info';
const ERROR = 'error';

export function ErrorHandler(error, serverLogger) {
  const errorLevel = ErrorLevels[error.error] || ERROR;
  try {
    serverLogger[errorLevel](
      `${error instanceof Error ? error.toString() : JSON.stringify(error)}`,
    );
  } catch (error) {
    serverLogger.error(
      `Message too long to show in console output, check the log file`,
    );
  }
}

const ErrorLevels = {
  401: INFO,
  403: ERROR,
  409: DEBUG,
  3005: INFO,
  3013: DEBUG,
  10001: INFO,
  10002: DEBUG,
  10003: DEBUG,
  10004: DEBUG,
  10005: DEBUG,
  10006: DEBUG,
  10007: DEBUG,
};
