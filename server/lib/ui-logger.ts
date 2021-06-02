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
import { WAZUH_DATA_LOGS_DIRECTORY_PATH, WAZUH_UI_LOGS_PLAIN_PATH ,WAZUH_UI_LOGS_RAW_PATH } from '../../common/constants';
import { createDataDirectoryIfNotExists } from './filesystem';

let allowed = false;
let wazuhUiLogger : winston.Logger | undefined = undefined;
let wazuhPlainUiLogger : winston.Logger | undefined = undefined;

export interface IUIPlainLoggerSettings {
    level: string,
    message: string
}

export interface IUILoggerSettings extends IUIPlainLoggerSettings {
    date: Date,
    location: string
}

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


  wazuhUiLogger = winston.createLogger({
    level,
    format: winston.format.json(),
    transports: [
      new winston.transports.File({
        filename: WAZUH_UI_LOGS_RAW_PATH
      })
    ]
  });

  // Prevents from exit on error related to the logger.
  wazuhUiLogger.exitOnError = false;

  wazuhPlainUiLogger = winston.createLogger({
    level,
    format: winston.format.simple(),
    transports: [
      new winston.transports.File({
        filename: WAZUH_UI_LOGS_PLAIN_PATH
      })
    ]
  });

  // Prevents from exit on error related to the logger.
  wazuhPlainUiLogger.exitOnError = false;
};

/**
 * Checks if wazuh/logs exists. If it doesn't exist, it will be created.
 */
const initDirectory = async () => {
  try {
    createDataDirectoryIfNotExists();
    createDataDirectoryIfNotExists('logs');
    if (
      typeof wazuhUiLogger === 'undefined' ||
      typeof wazuhPlainUiLogger === 'undefined' 
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
 * Checks if the wazuh-frontend.log file size is greater than 100MB, if so it rotates the file.
 */
 const checkUiLogFiles = () => {
  if (allowed) {
    if (getFilesizeInMegaBytes(WAZUH_UI_LOGS_RAW_PATH) >= 100) {
      fs.renameSync(
        WAZUH_UI_LOGS_RAW_PATH,
        `${WAZUH_DATA_LOGS_DIRECTORY_PATH}/wazuh-frontend.${new Date().getTime()}.log`
      );
      fs.writeFileSync(
        WAZUH_UI_LOGS_RAW_PATH,
        JSON.stringify({
          date: new Date(),
          level: 'info',
          location: 'logger',
          message: 'Rotated log file'
        }) + '\n'
      );
    }
    if (getFilesizeInMegaBytes(WAZUH_UI_LOGS_PLAIN_PATH) >= 100) {
      fs.renameSync(
        WAZUH_UI_LOGS_PLAIN_PATH,
        `${WAZUH_DATA_LOGS_DIRECTORY_PATH}/wazuh-frontend-plain.${new Date().getTime()}.log`
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
 * Main function to add a new log
 * @param {*} location File where the log is being thrown
 * @param {*} message Message to show
 * @param {*} level Optional, default is 'error'
 */

export async function addUiLog(location: string, message: string, level: string) {
  return await initDirectory()
    .then(() => {
      if (allowed) {
        checkUiLogFiles();

        const plainLogData: IUIPlainLoggerSettings = {
          level: level || 'error',
          message: `${yyyymmdd()}: ${location ||
            'Unknown origin'}: ${message || 'An error occurred'}`
        }

        wazuhPlainUiLogger.log(plainLogData);
        
        const logData: IUILoggerSettings = {
          date: new Date(),
          level: level || 'error',
          location: location || 'Unknown origin',
          message: message || 'An error occurred'
        }

        wazuhUiLogger.log(logData);
      }
    })
    .catch(error => {
      console.error(
        `Cannot create the logs directory due to:\n${error.message || error}`
      )
      throw(error)
    }
    );
}
