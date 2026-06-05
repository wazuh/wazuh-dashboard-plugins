import fs from 'fs';
import os from 'os';
import path from 'path';

import type {
  SavedObjectDashboard,
  SavedObjectVisualization,
} from './saved-object.types';
import {
  collectDefinitionFiles,
  isDefinitionFile,
  isSupportedType,
  parseDefinitionFile,
  parseNdjsonLine,
  readDashboardDefinitionFiles,
  toDashboardDefinitionFromFile,
} from './dashboard-definition-reader';
import { DEFAULT_EXTENSION } from './constants';

const directoriesToCleanup: string[] = [];

const createTempDir = () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'dashboard-definition-reader-'),
  );
  directoriesToCleanup.push(directory);
  return directory;
};

afterEach(() => {
  while (directoriesToCleanup.length) {
    const directory = directoriesToCleanup.pop();
    if (directory && fs.existsSync(directory)) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
});

const buildDashboard = (id: string): SavedObjectDashboard => ({
  id,
  type: 'dashboard',
  attributes: {
    title: `Dashboard ${id}`,
    kibanaSavedObjectMeta: { searchSourceJSON: '{}' },
    hits: 0,
    optionsJSON: '{}',
    panelsJSON: '[]',
    timeRestore: false,
  },
  references: [],
});

const buildVisualization = (id: string): SavedObjectVisualization => ({
  id,
  type: 'visualization',
  attributes: {
    title: `Visualization ${id}`,
    kibanaSavedObjectMeta: { searchSourceJSON: '{}' },
    uiStateJSON: '{}',
    visState: '{}',
  },
  references: [],
});

describe('dashboard definition reader helpers', () => {
  describe('isDefinitionFile', () => {
    it('matches the requested extension regardless of case', () => {
      expect(isDefinitionFile('/tmp/preset.NDjson', DEFAULT_EXTENSION)).toBe(
        true,
      );
      expect(isDefinitionFile('/tmp/preset.json', DEFAULT_EXTENSION)).toBe(
        false,
      );
    });
  });

  describe('collectDefinitionFiles', () => {
    it('collects matching files recursively', () => {
      const root = createTempDir();
      const nested = path.join(root, 'nested');
      fs.mkdirSync(nested, { recursive: true });
      const accepted = path.join(root, 'first.ndjson');
      const uppercase = path.join(nested, 'second.NDJSON');
      const ignored = path.join(nested, 'skip.txt');
      fs.writeFileSync(accepted, '');
      fs.writeFileSync(uppercase, '');
      fs.writeFileSync(ignored, '');

      const definitionFiles = collectDefinitionFiles(root, DEFAULT_EXTENSION);

      expect(definitionFiles).toHaveLength(2);
      expect(definitionFiles).toEqual(
        expect.arrayContaining([accepted, uppercase]),
      );
    });
  });

  describe('isSupportedType', () => {
    it('returns true only for dashboards and visualizations', () => {
      expect(isSupportedType('dashboard')).toBe(true);
      expect(isSupportedType('visualization')).toBe(true);
      expect(isSupportedType('index-pattern')).toBe(false);
    });
  });

  describe('parseNdjsonLine', () => {
    const filePath = '/tmp/dashboard.ndjson';

    it('parses valid ndjson content', () => {
      const line = JSON.stringify({
        type: 'dashboard',
        id: 'dash-parse',
        attributes: { title: 'dash-parse' },
        references: [],
      });
      expect(parseNdjsonLine(line, 1, filePath)).toEqual(JSON.parse(line));
    });

    it('ignores blank lines', () => {
      expect(parseNdjsonLine('   ', 2, filePath)).toBeNull();
    });

    it('fails when JSON is malformed', () => {
      expect(() => parseNdjsonLine('{', 3, filePath)).toThrow(
        /Invalid JSON in .* at line 3/,
      );
    });

    it('fails for unsupported saved object types', () => {
      const line = JSON.stringify({
        type: 'index-pattern',
        id: 'index',
        attributes: {},
        references: [],
      });
      expect(() => parseNdjsonLine(line, 4, filePath)).toThrow(
        /Unsupported type "index-pattern"/,
      );
    });

    it('fails when id or attributes are missing', () => {
      const line = JSON.stringify({
        type: 'dashboard',
        attributes: {},
        references: [],
      });
      expect(() => parseNdjsonLine(line, 5, filePath)).toThrow(
        /Missing id or attributes/,
      );
    });
  });

  describe('parseDefinitionFile', () => {
    it('parses lines and filters out whitespace', () => {
      const root = createTempDir();
      const filePath = path.join(root, 'definitions.ndjson');
      const dashboardLine = JSON.stringify(buildDashboard('dash-parse'));
      const visualizationLine = JSON.stringify(buildVisualization('vis-parse'));
      const content = ['', dashboardLine, '   ', visualizationLine, ''];
      fs.writeFileSync(filePath, content.join('\n'), 'utf8');

      const parsed = parseDefinitionFile(filePath);

      expect(parsed.map(entry => entry.id)).toEqual([
        'dash-parse',
        'vis-parse',
      ]);
    });
  });

  describe('toDashboardDefinitionFromFile', () => {
    it('builds a definition that includes the dashboard and its visualizations', () => {
      const filePath = path.join(createTempDir(), 'dashboard.ndjson');
      const dashboard = buildDashboard('main-dash');
      const visualization = buildVisualization('main-vis');

      const definition = toDashboardDefinitionFromFile(filePath, [
        dashboard,
        visualization,
      ]);

      expect(definition.dashboard).toBe(dashboard);
      expect(definition.visualizations).toEqual([visualization]);
      expect(definition.relativeFilePath).toBe(
        path.relative(process.cwd(), filePath),
      );
    });

    it('throws when no dashboard is present', () => {
      const filePath = path.join(createTempDir(), 'no-dashboard.ndjson');
      const visualization = buildVisualization('only-vis');

      expect(() =>
        toDashboardDefinitionFromFile(filePath, [visualization]),
      ).toThrow(
        new RegExp(
          `No dashboard object found inside "${path.basename(filePath)}"`,
        ),
      );
    });

    it('throws when more than one dashboard exists', () => {
      const filePath = path.join(createTempDir(), 'multiple.ndjson');
      const firstDashboard = buildDashboard('dash-1');
      const secondDashboard = buildDashboard('dash-2');

      expect(() =>
        toDashboardDefinitionFromFile(filePath, [
          firstDashboard,
          secondDashboard,
        ]),
      ).toThrow(
        new RegExp(
          `Expected a single dashboard object in "${path.basename(
            filePath,
          )}", found 2`,
        ),
      );
    });
  });

  describe('readDashboardDefinitionFiles', () => {
    it('loads definition files and keeps the file ordering sorted', () => {
      const root = createTempDir();
      const nested = path.join(root, 'nested');
      fs.mkdirSync(nested, { recursive: true });
      const firstFile = path.join(root, 'a.ndjson');
      const secondFile = path.join(nested, 'b.ndjson');
      const firstContent = [
        buildDashboard('dash-a'),
        buildVisualization('vis-a'),
      ];
      const secondContent = [
        buildDashboard('dash-b'),
        buildVisualization('vis-b'),
      ];

      fs.writeFileSync(
        firstFile,
        firstContent.map(entry => JSON.stringify(entry)).join('\n'),
        'utf8',
      );
      fs.writeFileSync(
        secondFile,
        secondContent.map(entry => JSON.stringify(entry)).join('\n'),
        'utf8',
      );

      const definitions = readDashboardDefinitionFiles({
        folderPath: root,
        extension: DEFAULT_EXTENSION,
      });

      expect(definitions.map(def => def.filePath)).toEqual(
        [firstFile, secondFile].sort(),
      );
      expect(definitions).toHaveLength(2);
      expect(definitions[0].visualizations[0].id).toBe('vis-a');
      expect(definitions[1].visualizations[0].id).toBe('vis-b');
    });

    it('throws when the provided folder path is missing or not a directory', () => {
      const filePath = path.join(createTempDir(), 'placeholder');
      fs.writeFileSync(filePath, '');

      expect(() =>
        readDashboardDefinitionFiles({ folderPath: filePath }),
      ).toThrow(/Dashboard definitions folder not found/);

      expect(() =>
        readDashboardDefinitionFiles({
          folderPath: path.join(filePath, 'missing'),
        }),
      ).toThrow(/Dashboard definitions folder not found/);
    });
  });
});
