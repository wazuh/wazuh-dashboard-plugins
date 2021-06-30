/*
 * Wazuh app - Module for logging functions
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import winston from 'winston';
import fs from 'fs';
import { getConfiguration } from './get-configuration';
import { WAZUH_DATA_LOGS_DIRECTORY_PATH, WAZUH_DATA_LOGS_PLAIN_PATH, WAZUH_DATA_LOGS_RAW_PATH } from '../../common/constants';
import { createDataDirectoryIfNotExists } from './filesystem';

let allowed = false;
let wazuhlogger = undefined;
let wazuhPlainLogger = undefined;

/**
 * Here we create the loggers
 */
const initLogger = () => {
  const configurationFile = getConfiguration();
  const level =
    typeof (configurationFile || {})['logs.level'] !== 'undefined' &&
    ['info', 'debug'].includes(configurationFile['logs.level'])
      ? configurationFile['logs.level']
      : 'info';

  // JSON logger
  wazuhlogger = winston.createLogger({
    level,
    format: winston.format.json(),
    transports: [
      new winston.transports.File({
        filename: WAZUH_DATA_LOGS_RAW_PATH
      })
    ]
  });

  // Prevents from exit on error related to the logger.
  wazuhlogger.exitOnError = false;

  // Plain text logger
  wazuhPlainLogger = winston.createLogger({
    level,
    format: winston.format.simple(),
    transports: [
      new winston.transports.File({
        filename: WAZUH_DATA_LOGS_PLAIN_PATH
      })
    ]
  });

  // Prevents from exit on error related to the logger.
  wazuhPlainLogger.exitOnError = false;
};

/**
 * Checks if wazuh/logs exists. If it doesn't exist, it will be created.
 */
const initDirectory = async () => {
  try {
    createDataDirectoryIfNotExists();
    createDataDirectoryIfNotExists('logs');
    if (
      typeof wazuhlogger === 'undefined' ||
      typeof wazuhPlainLogger === 'undefined'
    ) {
      initLogger();
    }
    allowed = true;
    return;
  } catch (error) {
    allowed = false;
    return Promise.reject(error);
  }
};

/**
 * Returns given file size in MB, if the file doesn't exist returns 0
 * @param {*} filename Path to the file
 */
const getFilesizeInMegaBytes = filename => {
  if (allowed) {
    if (fs.existsSync(filename)) {
      const stats = fs.statSync(filename);
      const fileSizeInMegaBytes = stats.size;

      return fileSizeInMegaBytes / 1000000.0;
    }
  }
  return 0;
};

/**
 * Checks if the wazuhapp.log file size is greater than 100MB, if so it rotates the file.
 */
const checkFiles = () => {
  if (allowed) {
    if (getFilesizeInMegaBytes(WAZUH_DATA_LOGS_RAW_PATH) >= 100) {
      fs.renameSync(
        WAZUH_DATA_LOGS_RAW_PATH,
        `${WAZUH_DATA_LOGS_DIRECTORY_PATH}/wazuhapp.${new Date().getTime()}.log`
      );
      fs.writeFileSync(
        WAZUH_DATA_LOGS_RAW_PATH,
        JSON.stringify({
          date: new Date(),
          level: 'info',
          location: 'logger',
          message: 'Rotated log file'
        }) + '\n'
      );
    }
    if (getFilesizeInMegaBytes(WAZUH_DATA_LOGS_PLAIN_PATH) >= 100) {
      fs.renameSync(
        WAZUH_DATA_LOGS_PLAIN_PATH,
        `${WAZUH_DATA_LOGS_DIRECTORY_PATH}/wazuhapp-plain.${new Date().getTime()}.log`
      );
    }
  }
};

const yyyymmdd = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hour = now.getHours();
  return `${y}/${m < 10 ? '0' : ''}${m}/${
    d < 10 ? '0' : ''
  }${d} ${hour}:${minutes}:${seconds}`;
};

/**
 * This function filter some known interfaces to avoid log hug objects
 * @param data string | object
 * @returns the data parsed 
 */
const parseData = (data: any) => {
  let parsedData = data instanceof Error ? { 
    message: data.message,
    stack: data.stack
  } : data;

  // when error is AxiosError, it extends from Error
  if (data.isAxiosError) {
    const { config } = data;
    parsedData = {
      ...parsedData,
      config: {
        url: config.url,
        method: config.method,
        data: config.data,
        params: config.data,
      }
    };
  }

  if (typeof parsedData === 'object')
    parsedData.toString = () => JSON.stringify(parsedData);

  return parsedData;
}

/**
 * Main function to add a new log
 * @param {*} location File where the log is being thrown
 * @param {*} message Message to show
 * @param {*} level Optional, default is 'error'
 */
export function log(location, data, level) {
  const parsedData = parseData(data);  
  initDirectory()
    .then(() => {
      if (allowed) {
        checkFiles();
        const options: any = {
          date: new Date(),
          level: level || 'error',
          location: location || 'Unknown origin',
          data: parsedData
        };
        if (typeof data == 'string') {
          options.message = parsedData;
          delete options.data;
        }
        wazuhlogger.log(options);
        
        wazuhPlainLogger.log({
          level: level || 'error',
          message: `${yyyymmdd()}: ${location ||
            'Unknown origin'}: ${parsedData.toString() || 'An error occurred'}`
        });
      }
    })
    .catch(error =>
      // eslint-disable-next-line
      console.error(
        `Cannot create the logs directory due to:\n${error.message || error}`
      )
    );
}
