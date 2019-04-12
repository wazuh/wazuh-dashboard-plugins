/*
 * Wazuh app - Module for logging functions
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
import path from 'path';
import { getConfiguration } from './lib/get-configuration';

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
        filename: path.join(
          __dirname,
          '../../../optimize/wazuh-logs/wazuhapp.log'
        )
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
        filename: path.join(
          __dirname,
          '../../../optimize/wazuh-logs/wazuhapp-plain.log'
        )
      })
    ]
  });

  // Prevents from exit on error related to the logger.
  wazuhPlainLogger.exitOnError = false;
};

/**
 * Checks if wazuh-logs exists. If it doesn't exist, it will be created.
 */
const initDirectory = async () => {
  try {
    if (!fs.existsSync(path.join(__dirname, '../../../optimize/wazuh-logs'))) {
      fs.mkdirSync(path.join(__dirname, '../../../optimize/wazuh-logs'));
    }
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
    if (
      getFilesizeInMegaBytes(
        path.join(__dirname, '../../../optimize/wazuh-logs/wazuhapp.log')
      ) >= 100
    ) {
      fs.renameSync(
        path.join(__dirname, '../../../optimize/wazuh-logs/wazuhapp.log'),
        path.join(
          __dirname,
          `../../../optimize/wazuh-logs/wazuhapp.${new Date().getTime()}.log`
        )
      );
      fs.writeFileSync(
        path.join(__dirname, '../../../optimize/wazuh-logs/wazuhapp.log'),
        JSON.stringify({
          date: new Date(),
          level: 'info',
          location: 'logger',
          message: 'Rotated log file'
        }) + '\n'
      );
    }
    if (
      getFilesizeInMegaBytes(
        path.join(__dirname, '../../../optimize/wazuh-logs/wazuhapp-plain.log')
      ) >= 100
    ) {
      fs.renameSync(
        path.join(__dirname, '../../../optimize/wazuh-logs/wazuhapp-plain.log'),
        path.join(
          __dirname,
          `../../../optimize/wazuh-logs/wazuhapp-plain.${new Date().getTime()}.log`
        )
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
export function log(location, message, level) {
  initDirectory()
    .then(() => {
      if (allowed) {
        checkFiles();
        wazuhlogger.log({
          date: new Date(),
          level: level || 'error',
          location: location || 'Unknown origin',
          message: message || 'An error occurred'
        });
        try {
          wazuhPlainLogger.log({
            level: level || 'error',
            message: `${yyyymmdd()}: ${location ||
              'Unknown origin'}: ${message || 'An error occurred'}`
          });
        } catch (error) {}
      }
    })
    .catch(error =>
      // eslint-disable-next-line
      console.error(
        `Cannot create the logs directory due to:\n${error.message || error}`
      )
    );
}
