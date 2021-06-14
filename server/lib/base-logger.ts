/*
 * Wazuh app - Settings controller
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
import path from 'path';
import { getConfiguration } from './get-configuration';
import { createDataDirectoryIfNotExists } from './filesystem';

import { WAZUH_DATA_LOGS_DIRECTORY_PATH } from '../../common/constants';

export interface IUIPlainLoggerSettings {
  level: string;
  message: string;
}

export interface IUILoggerSettings extends IUIPlainLoggerSettings {
  date: Date;
  location: string;
}

export class BaseLogger {
  allowed: boolean = false;
  wazuhLogger: winston.Logger | undefined = undefined;
  wazuhPlainLogger: winston.Logger | undefined = undefined;
  PLAIN_LOGS_PATH: string = '';
  RAW_LOGS_PATH: string = '';

  constructor(plainLogsPath: string, rawLogsPath: string) {
    this.PLAIN_LOGS_PATH = path.join(WAZUH_DATA_LOGS_DIRECTORY_PATH, plainLogsPath);
    this.RAW_LOGS_PATH = path.join(WAZUH_DATA_LOGS_DIRECTORY_PATH, rawLogsPath);
  }

  /**
   * Initialize loggers, plain and raw logger
   */
  private initLogger = () => {
    const configurationFile = getConfiguration();
    const level =
      typeof (configurationFile || {})['logs.level'] !== 'undefined' &&
      ['info', 'debug'].includes(configurationFile['logs.level'])
        ? configurationFile['logs.level']
        : 'info';

    // JSON logger
    this.wazuhLogger = winston.createLogger({
      level,
      format: winston.format.json(),
      transports: [
        new winston.transports.File({
          filename: this.RAW_LOGS_PATH,
        }),
      ],
    });

    // Prevents from exit on error related to the logger.
    this.wazuhLogger.exitOnError = false;

    // Plain text logger
    this.wazuhPlainLogger = winston.createLogger({
      level,
      format: winston.format.simple(),
      transports: [
        new winston.transports.File({
          filename: this.PLAIN_LOGS_PATH,
        }),
      ],
    });

    // Prevents from exit on error related to the logger.
    this.wazuhPlainLogger.exitOnError = false;
  };

  /**
   * Checks if wazuh/logs exists. If it doesn't exist, it will be created.
   */
  initDirectory = async () => {
    try {
      createDataDirectoryIfNotExists();
      createDataDirectoryIfNotExists('logs');
      if (typeof this.wazuhLogger === 'undefined' || typeof this.wazuhPlainLogger === 'undefined') {
        this.initLogger();
      }
      this.allowed = true;
      return;
    } catch (error) {
      this.allowed = false;
      return Promise.reject(error);
    }
  };

  /**
   * Returns given file size in MB, if the file doesn't exist returns 0
   * @param {*} filename Path to the file
   */
  getFilesizeInMegaBytes = (filename) => {
    if (this.allowed) {
      if (fs.existsSync(filename)) {
        const stats = fs.statSync(filename);
        const fileSizeInMegaBytes = stats.size;

        return fileSizeInMegaBytes / 1000000.0;
      }
    }
    return 0;
  };

  /**
   * Check if file exist
   * @param filename
   * @returns boolean
   */
  checkFileExist = (filename) => {
    return fs.existsSync(filename);
  };

  /**
   * Checks if the wazuhapp.log file size is greater than 100MB, if so it rotates the file.
   */
  private checkFiles = () => {
    if (this.allowed) {
      // check raw log file
      if (this.getFilesizeInMegaBytes(this.RAW_LOGS_PATH) >= 100) {
        fs.renameSync(
          this.RAW_LOGS_PATH,
          `${WAZUH_DATA_LOGS_DIRECTORY_PATH}/wazuhapp.${new Date().getTime()}.log`
        );
        fs.writeFileSync(
          this.RAW_LOGS_PATH,
          JSON.stringify({
            date: new Date(),
            level: 'info',
            location: 'logger',
            message: 'Rotated log file',
          }) + '\n'
        );
      }

      // check log file
      if (this.getFilesizeInMegaBytes(this.PLAIN_LOGS_PATH) >= 100) {
        fs.renameSync(
          this.PLAIN_LOGS_PATH,
          `${WAZUH_DATA_LOGS_DIRECTORY_PATH}/wazuhapp-plain.${new Date().getTime()}.log`
        );
      }
    }
  };

  /**
   * Get Current Date
   * @returns string
   */
  private yyyymmdd = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hour = now.getHours();
    return `${y}/${m < 10 ? '0' : ''}${m}/${d < 10 ? '0' : ''}${d} ${hour}:${minutes}:${seconds}`;
  };

  /**
   * Main function to add a new log
   * @param {*} location File where the log is being thrown
   * @param {*} message Message to show
   * @param {*} level Optional, default is 'error'
   */

  async log(location: string, message: string, level: string) {
    return this.initDirectory()
      .then(() => {
        if (this.allowed) {
          this.checkFiles();

          const plainLogData: IUIPlainLoggerSettings = {
            level: level || 'error',
            message: `${this.yyyymmdd()}: ${location || 'Unknown origin'}: ${
              message || 'An error occurred'
            }`,
          };

          this.wazuhPlainLogger.log(plainLogData);

          const logData: IUILoggerSettings = {
            date: new Date(),
            level: level || 'error',
            location: location || 'Unknown origin',
            message: message || 'An error occurred',
          };

          this.wazuhLogger.log(logData);
        }
      })
      .catch((error) => {
        console.error(`Cannot create the logs directory due to:\n${error.message || error}`);
        throw error;
      });
  }
}
