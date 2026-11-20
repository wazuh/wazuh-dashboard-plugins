import type { InitializationTaskRunContext } from '../types';
import type { MissingFieldsReport } from '../../../common/saved-objects-missing-fields';
import { scanMissingFields, findScannedObjects } from './scan-missing-fields';
import {
  buildMissingFieldsMessage,
  initializationTaskCreatorSavedObjectsMissingFields,
} from './task';

jest.mock('./scan-missing-fields');

const report = (n: number): MissingFieldsReport => ({
  id: `vis-${n}`,
  type: 'visualization',
  title: `Vis ${n}`,
  indexPatternId: 'findings',
  indexPatternTitle: 'wazuh-findings-v5*',
  missing: [
    { field: 'rule.groups', usedIn: ['query', 'aggregation'] },
    { field: 'timestamp', usedIn: ['sort'] },
  ],
});

const createContext = () => ({
  logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
  context: {
    scope: 'internal',
    services: {
      core: { savedObjects: { createInternalRepository: jest.fn(() => ({})) } },
    },
  },
  taskResult: {
    ok: jest.fn(data => ({ result: 'green', data })),
    warning: jest.fn((message, data) => ({ result: 'yellow', message, data })),
  },
});

describe('buildMissingFieldsMessage', () => {
  it('names each object, its index pattern, and its missing fields', () => {
    expect(buildMissingFieldsMessage([report(1)])).toBe(
      'A visualization or saved search uses fields its index pattern does not have, so its panel may show no data or wrong data.\n\n' +
        '- visualization [Vis 1] on index pattern [wazuh-findings-v5*]: rule.groups (query, aggregation), timestamp (sort)',
    );
  });

  it('lists the first 20 objects and counts the rest', () => {
    const message = buildMissingFieldsMessage(
      Array.from({ length: 23 }, (_, n) => report(n)),
    );

    expect(message).toMatch(/^23 visualizations and saved searches use fields/);
    expect(message).toContain('[Vis 19]');
    expect(message).not.toContain('[Vis 20]');
    expect(message).toMatch(
      /- 3 more\. Export the health check data to see them all\.$/,
    );
  });
});

describe('initializationTaskCreatorSavedObjectsMissingFields', () => {
  const task = initializationTaskCreatorSavedObjectsMissingFields({
    taskName: 'saved-objects:missing-fields',
  });

  beforeEach(() => {
    jest
      .mocked(findScannedObjects)
      .mockResolvedValue({ objects: [], total: 0 });
  });

  it('is green when every object uses existing fields', async () => {
    jest.mocked(scanMissingFields).mockResolvedValue([]);
    const ctx = createContext();

    expect(
      await task.run(ctx as unknown as InitializationTaskRunContext),
    ).toEqual({ result: 'green', data: [] });
  });

  it('warns with the affected objects', async () => {
    jest.mocked(scanMissingFields).mockResolvedValue([report(1)]);
    const ctx = createContext();

    const result = await task.run(
      ctx as unknown as InitializationTaskRunContext,
    );

    expect(result).toEqual({
      result: 'yellow',
      message: buildMissingFieldsMessage([report(1)]),
      data: [report(1)],
    });
    expect(ctx.logger.warn).toHaveBeenCalledWith(
      'Visualizations and saved searches using missing fields: 1',
    );
    expect(ctx.logger.debug).toHaveBeenCalledWith(
      buildMissingFieldsMessage([report(1)]),
    );
  });

  it('warns when there are more objects than it can read', async () => {
    jest
      .mocked(findScannedObjects)
      .mockResolvedValue({ objects: [], total: 12000 });
    jest.mocked(scanMissingFields).mockResolvedValue([]);
    const ctx = createContext();

    await task.run(ctx as unknown as InitializationTaskRunContext);

    expect(ctx.logger.warn).toHaveBeenCalledWith(
      'Checked the fields of the first 0 of 12000 visualizations and saved searches',
    );
  });

  it('fails with the cause when the saved objects cannot be read', async () => {
    jest
      .mocked(findScannedObjects)
      .mockRejectedValue(new Error('index closed'));
    const ctx = createContext();

    await expect(
      task.run(ctx as unknown as InitializationTaskRunContext),
    ).rejects.toThrow(
      'Error checking the fields used by saved objects: index closed',
    );
  });
});
