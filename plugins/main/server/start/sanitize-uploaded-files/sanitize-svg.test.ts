import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { PLUGIN_SETTINGS } from '../../../common/constants';
import { createDirectoryIfNotExists } from '../../lib/filesystem';
import sanitizeUploadedSVG from './sanitize-svg';
import { sanitizeSVG } from '../../lib/sanitizer';
import * as configuration from '../../lib/get-configuration';
import maliciousMockSVG from './__mocks__/malicious.customization.logo.app.svg.ts';
import sanitizedMockSVG from './__mocks__/sanitized.customization.logo.app.svg.ts';

const customImageDirectory = path.join(
  __dirname,
  '../../..',
  PLUGIN_SETTINGS['customization.logo.app'].options.file.store
    .relativePathFileSystem,
);

function mockContextCreator(loggerLevel: string) {
  const logs = [];
  const levels = ['debug', 'info', 'warn', 'error'];

  function createLogger(level: string) {
    return jest.fn(function (message: string) {
      const levelLogIncluded: number = levels.findIndex(
        level => level === loggerLevel,
      );
      levelLogIncluded > -1 &&
        levels.slice(levelLogIncluded).includes(level) &&
        logs.push({ level, message });
    });
  }

  const ctx = {
    wazuh: {
      logger: {
        info: createLogger('info'),
        warn: createLogger('warn'),
        error: createLogger('error'),
        debug: createLogger('debug'),
      },
    },
    /* Mocked logs getter. It is only for testing purpose.*/
    _getLogs(logLevel: string) {
      return logLevel ? logs.filter(({ level }) => level === logLevel) : logs;
    },
  };
  return ctx;
}

jest.mock('../../lib/logger', () => ({
  log: jest.fn(),
}));

beforeAll(() => {
  // Create custom images directory
  createDirectoryIfNotExists(customImageDirectory);
});

afterAll(() => {
  jest.clearAllMocks();
  // Remove custom images directory

  execSync(`rm -rf ${customImageDirectory}`);
});

describe('[Sanitize SVG cronjob] Sanitize different custom logos.', () => {
  let mockContext = mockContextCreator('debug');
  jest.fn(sanitizeSVG);
  describe('[Sanitize SVG cronjob] No custom logos setup.', () => {
    it('With no custom logos does not sanitize any file', () => {
      jest
        .spyOn(configuration, 'getConfiguration')
        .mockImplementationOnce(() => ({}));
      sanitizeUploadedSVG(mockContext);
      expect(
        mockContext
          ._getLogs()
          .filter(({ message }) =>
            message.includes(
              `[customization.logo.sidebar] not customized. Skip.`,
            ),
          ),
      ).toHaveLength(1);
      expect(
        mockContext
          ._getLogs()
          .filter(({ message }) =>
            message.includes(
              `[customization.logo.healthcheck] not customized. Skip.`,
            ),
          ),
      ).toHaveLength(1);
      expect(
        mockContext
          ._getLogs()
          .filter(({ message }) =>
            message.includes(`[customization.logo.app] not customized. Skip.`),
          ),
      ).toHaveLength(1);
    });
  });

  describe('[Sanitize SVG cronjob] No custom logos setup.', () => {
    const filename = 'customization.logo.app.svg';
    beforeAll(() => {
      // Save the clean file in the target directory
      fs.writeFileSync(
        path.join(customImageDirectory, filename),
        Buffer.from(maliciousMockSVG),
      );
    });
    afterAll(() => {
      fs.unlinkSync(path.join(customImageDirectory, filename));
    });
    it('[Sanitize SVG cronjob] Sanitize script in customization.logo.app.svg file', () => {
      jest
        .spyOn(configuration, 'getConfiguration')
        .mockImplementationOnce(() => ({
          'customization.logo.app':
            'custom/images/customization.logo.app.svg?v=123456789',
        }));
      sanitizeUploadedSVG(mockContext);
      const sanitizedFileBuffer = fs.readFileSync(
        path.join(customImageDirectory, filename),
      );
      const sanitizedSVGString = sanitizedFileBuffer.toString();
      expect(sanitizedSVGString).toEqual(sanitizedMockSVG);
      expect(
        mockContext
          ._getLogs()
          .filter(({ message }) =>
            message.includes(`customization.logo.app.svg SVG file sanitized`),
          ),
      ).toHaveLength(1);
    });
  });
});
