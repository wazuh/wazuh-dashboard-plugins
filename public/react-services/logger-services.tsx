import { getToasts } from '../kibana-services';
import { UILogLevel, UILogSeverity } from '../../common/constants';

export interface ILoggerOptions {
  context: string;
  level: UILogLevel;
  severity: UILogSeverity;
  display?: boolean;
  store?: boolean;
  error: Error;
}

/**
  Use Example
  -----------------
  logger.error('Loans history page components fetch has failed', {
      context: 'agentService',
      level: mylogger.WARNING,
      severity: 'UI',
      display: true,
      log: true,
      error,
  });
 */

const showToast = (color, title, text, time) => {
  getToasts().add({
    color: color,
    title: title,
    text: text,
    toastLifeTimeMs: time,
  });
};

/**
 * @param message
 */
const showErrorToast = (message) => {
  showToast('danger', 'Error', message, 3000);
};

/**
 * @param message
 * @param options
 */
const launchLog = (message: string, options: ILoggerOptions) => {
  const display = options.display || false;
  const log = options.store || false;

  if (display) {
    showErrorToast(`${message} ${options.error}`);
  }

  if (log) {
    // if log is true then call to endpoint to save frontend logs
    console.log('log service error', message, options);
  }
};

/**
 * @param message
 * @param options
 */
const error = (message: string, options: ILoggerOptions) => {
  //const level : UILogLevel = 'ERROR';
  // i think is better to set level inside method, maybe in future.
  launchLog(message, options);
};

/**
 * @param message
 * @param options
 */
const info = (message: string, options: ILoggerOptions) => {
  //const level : UILogLevel = 'INFO';
  launchLog(message, options);
};

/**
 * @param message
 * @param options
 */
const warning = (message: string, options: ILoggerOptions) => {
  //const level : UILogLevel = 'WARNING';
  launchLog(message, options);
};

export default {
  error,
  info,
  warning,
};
