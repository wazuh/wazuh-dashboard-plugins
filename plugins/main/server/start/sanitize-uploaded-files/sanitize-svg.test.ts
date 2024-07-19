import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { createDirectoryIfNotExists } from '../../lib/filesystem';
import sanitizeUploadedSVG from './sanitize-svg';
import { sanitizeSVG } from '../../lib/sanitizer';
import maliciousMockSVG from './__mocks__/malicious.customization.logo.app.svg.ts';
import sanitizedMockSVG from './__mocks__/sanitized.customization.logo.app.svg.ts';

const customImageDirectory = path.join(
  __dirname,
  '../../..',
  'public/assets/custom/images',
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
    wazuh_core: {
      configuration: {
        _settings: {
          get: jest.fn(),
        },
        get: jest.fn(),
        set: jest.fn(),
      },
    },
    /* Mocked logs getter. It is only for testing purpose.*/
    _getLogs(logLevel: string) {
      return logLevel ? logs.filter(({ level }) => level === logLevel) : logs;
    },
  };
  return ctx;
}

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
    it('With no custom logos does not sanitize any file', async () => {
      mockContext.wazuh_core.configuration.get.mockImplementationOnce(
        () => ({}),
      );
      mockContext.wazuh_core.configuration._settings.get.mockImplementation(
        key =>
          Object.fromEntries(
            [
              'customization.logo.sidebar',
              'customization.logo.healthcheck',
              'customization.logo.app',
            ].map(key => [
              key,
              {
                options: {
                  file: {
                    store: {
                      resolveStaticURL: filename => `custom/images/${filename}`,
                    },
                  },
                },
              },
            ]),
          )[key],
      );
      await sanitizeUploadedSVG(mockContext);
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
    it('[Sanitize SVG cronjob] Sanitize script in customization.logo.app.svg file', async () => {
      mockContext.wazuh_core.configuration.get.mockImplementationOnce(() => ({
        'customization.logo.app':
          'custom/images/customization.logo.app.svg?v=123456789',
      }));
      mockContext.wazuh_core.configuration._settings.get.mockImplementationOnce(
        () =>
          Object.fromEntries(
            [
              'customization.logo.sidebar',
              'customization.logo.healthcheck',
              'customization.logo.app',
            ].map(key => [
              key,
              {
                options: {
                  file: {
                    store: {
                      resolveStaticURL: filename => `custom/images/${filename}`,
                    },
                  },
                },
              },
            ]),
          ),
      );
      await sanitizeUploadedSVG(mockContext);
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
