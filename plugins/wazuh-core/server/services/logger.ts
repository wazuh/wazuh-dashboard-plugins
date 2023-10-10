import { BaseLogger } from './base-logger';
import {
  WAZUH_DATA_LOGS_PLAIN_FILENAME,
  WAZUH_DATA_LOGS_RAW_FILENAME,
} from '../../common/constants';

const logger = new BaseLogger(WAZUH_DATA_LOGS_PLAIN_FILENAME, WAZUH_DATA_LOGS_RAW_FILENAME);

export const log = (location: string, message: string, level?: string) => {
  logger.log(location, message, level);
};
