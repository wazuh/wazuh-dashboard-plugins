import fs from 'fs';
import md5 from 'md5';
import { execSync } from 'child_process';
import path from 'path';
import { WAZUH_DATA_ABSOLUTE_PATH, WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH, WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH } from '../../../common/constants';
import { createDataDirectoryIfNotExists, createDirectoryIfNotExists } from '../../lib/filesystem';
import migrateReportsDirectoryName, { isMD5 } from './reports_directory_name';

function mockContextCreator(loggerLevel: string) {
  const logs = [];
  const levels = ['debug', 'info', 'warn', 'error'];

  function createLogger(level: string) {
    return jest.fn(function (message: string) {
      const levelLogIncluded: number = levels.findIndex((level) => level === loggerLevel);
      levelLogIncluded > -1
        && levels.slice(levelLogIncluded).includes(level)
        && logs.push({ level, message });
    });
  };

  const ctx = {
    wazuh: {
      logger: {
        info: createLogger('info'),
        warn: createLogger('warn'),
        error: createLogger('error'),
        debug: createLogger('debug')
      }
    },
    /* Mocked logs getter. It is only for testing purpose.*/
    _getLogs(logLevel: string) {
      return logLevel ? logs.filter(({ level }) => level === logLevel) : logs;
    }
  }
  return ctx;
};

jest.mock('../../lib/logger', () => ({
  log: jest.fn()
}));

beforeAll(() => {
  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
  createDataDirectoryIfNotExists();
  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/downloads directory.
  createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH);
});

afterAll(() => {
  // Remove <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
  execSync(`rm -rf ${WAZUH_DATA_ABSOLUTE_PATH}`);
});

describe("[migration] `reports` directory doesn't exist", () => {
  let mockContext = mockContextCreator('debug');

  it("Debug mode - Task started and skipped because of the `reports` directory doesn't exit", () => {
    // Migrate the directories
    migrateReportsDirectoryName(mockContext);
    // Logs that the task started and skipped.
    expect(mockContext._getLogs('debug').filter(({ message }) => message.includes("Task started"))).toHaveLength(1);
    expect(mockContext._getLogs('debug').filter(({ message }) => message.includes("Reports directory doesn't exist. The task is not required. Skip."))).toHaveLength(1);
  });

});

describe('[migration] Rename the subdirectories of `reports` directory', () => {
  let mockContext = null;

  beforeEach(() => {
    mockContext = mockContextCreator('info');
    // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/downloads/reports directory.
    createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH);
  });

  afterEach(() => {
    mockContext = null;
    execSync(`rm -rf ${WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH}`);
  });

  const userNameDirectory1 = { name: 'user1', files: 0 };
  const userNameDirectory2 = { name: 'user2', files: 0 };
  const userNameDirectory3 = { name: 'user3', files: 0 };
  const userNameDirectory4 = { name: 'user4', files: 0 };
  const userNameDirectory1MD5 = { name: md5('user1'), files: 0 };
  const userNameDirectory1MD5WithFiles = { name: md5('user1'), files: 1 };
  const userNameDirectory2MD5WithFiles = { name: md5('user2'), files: 1 };
  const userNameDirectory1WithFiles = { name: 'user1', files: 1 };
  const userNameDirectory2WithFiles = { name: 'user2', files: 0 };

  const userDirectoriesTest1 = [];
  const userDirectoriesTest2 = [userNameDirectory1, userNameDirectory2];
  const userDirectoriesTest3 = [userNameDirectory1, userNameDirectory2, userNameDirectory3, userNameDirectory4];
  const userDirectoriesTest4 = [userNameDirectory1, userNameDirectory1MD5];
  const userDirectoriesTest5 = [{ ...userNameDirectory1, errorRenaming: true }, userNameDirectory1MD5WithFiles, userNameDirectory2];
  const userDirectoriesTest6 = [{ ...userNameDirectory1, errorRenaming: true }, userNameDirectory1MD5WithFiles, { ...userNameDirectory2, errorRenaming: true }, userNameDirectory2MD5WithFiles];
  const userDirectoriesTest7 = [userNameDirectory1WithFiles, userNameDirectory2WithFiles];
  const userDirectoriesTest8 = [userNameDirectory1MD5WithFiles, userNameDirectory2MD5WithFiles];

  function formatUserDirectoriesTest(inputs: any) {
    return inputs.length
      ? inputs.map(input => `[${input.name}:${input.files}${input.errorRenaming ? ' (Error: renaming)' : ''}]`).join(', ')
      : 'None'
  };

  it.each`
		directories               | foundRequireRenamingDirectories | renamedDirectories | title
		${userDirectoriesTest1}   | ${0}                            | ${0}               | ${formatUserDirectoriesTest(userDirectoriesTest1)}
		${userDirectoriesTest2}   | ${2}                            | ${2}               | ${formatUserDirectoriesTest(userDirectoriesTest2)}
		${userDirectoriesTest3}   | ${4}                            | ${4}               | ${formatUserDirectoriesTest(userDirectoriesTest3)}
		${userDirectoriesTest4}   | ${1}                            | ${1}               | ${formatUserDirectoriesTest(userDirectoriesTest4)}
		${userDirectoriesTest5}   | ${2}                            | ${1}               | ${formatUserDirectoriesTest(userDirectoriesTest5)}
		${userDirectoriesTest6}   | ${2}                            | ${0}               | ${formatUserDirectoriesTest(userDirectoriesTest6)}
		${userDirectoriesTest7}   | ${2}                            | ${2}               | ${formatUserDirectoriesTest(userDirectoriesTest7)}
		${userDirectoriesTest8}   | ${0}                            | ${0}               | ${formatUserDirectoriesTest(userDirectoriesTest8)}
	`('Migrate Directories: $title - FoundRequireRenamingDirectories: $foundRequireRenamingDirectories - renamedDirectories: $renamedDirectories.', ({ directories, foundRequireRenamingDirectories, renamedDirectories }) => {

    const errorRenamingDirectoryMessages = foundRequireRenamingDirectories - renamedDirectories;
    // Create directories and file/s within directory.
    directories.forEach(({ name, files }) => {
      createDirectoryIfNotExists(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, name));
      if (files) {
        Array.from(Array(files).keys()).forEach(indexFile => {
          fs.closeSync(fs.openSync(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, name, `report_${indexFile}.pdf`), 'w'));
        });
      }
    });

    // Migrate the directories.
    migrateReportsDirectoryName(mockContext);

    // Check the quantity of directories were found for renaming renaming.
    expect(mockContext._getLogs().filter(({ message }) => message.includes('Found reports directory to migrate'))).toHaveLength(foundRequireRenamingDirectories);
    // Check the quantity of directories were renamed.
    expect(mockContext._getLogs().filter(({ message }) => message.includes('Renamed directory ['))).toHaveLength(renamedDirectories);
    expect(mockContext._getLogs('error').filter(({ message }) => message.includes(`Error renaming directory [`))).toHaveLength(errorRenamingDirectoryMessages);

    directories.forEach(({ name, ...rest }) => {
      if (!rest.errorRenaming) {
        if (isMD5(name)) {
          // If directory name is a valid MD5, the directory should exist.
          expect(fs.existsSync(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, name))).toBe(true);
        } else {
          // If directory name is not a valid MD5, the directory should be renamed. New directory exists and old directory doesn't exist.
          expect(mockContext._getLogs().filter(({ message }) => message.includes(`Renamed directory [${name}`))).toHaveLength(1);
          expect(mockContext._getLogs().filter(({ message }) => message.includes(`Found reports directory to migrate: [${name}`))).toHaveLength(1);
          expect(fs.existsSync(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, md5(name)))).toBe(true);
          expect(!fs.existsSync(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, name))).toBe(true);
        };
      } else {
        // Check there was an error renaming the directory because of the directory exist and contains files.
        expect(mockContext._getLogs().filter(({ message }) => message.includes(`Found reports directory to migrate: [${name}`))).toHaveLength(1);
        expect(
          mockContext._getLogs('error').some(({ message }) => message.includes(`Error renaming directory [${name}`))
        ).toBe(true);
        expect(fs.existsSync(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, name))).toBe(true);
        expect(fs.existsSync(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, md5(name)))).toBe(true);
      }
    });
  });
});
