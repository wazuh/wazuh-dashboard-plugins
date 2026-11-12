import { toTableColumns } from './wz-flyout-discover';
import type { IndexPattern } from '../../../../../../src/plugins/data/public';

describe('toTableColumns', () => {
  const timestamp = '2026-10-27T12:00:00.123456789Z';
  const convert = jest.fn(value => `formatted ${value}`);
  const indexPattern = {
    fields: {
      getByName: (name: string) =>
        name === '@timestamp'
          ? { name, type: 'date' }
          : { name, type: 'string' },
    },
    getFormatterForField: () => ({ convert }),
  };

  it('formats date columns with the index pattern formatter', () => {
    const [column] = toTableColumns(
      [{ id: '@timestamp', displayAsText: 'Time' }],
      indexPattern as unknown as IndexPattern,
    ) as Array<{ render: (value: string) => string }>;
    expect(column.render(timestamp)).toBe(`formatted ${timestamp}`);
  });

  it('keeps other columns and custom renders as they are', () => {
    const [plain, custom] = toTableColumns(
      [
        { id: 'agent.name', displayAsText: 'Agent' },
        { id: '@timestamp', displayAsText: 'Time', render: () => 'custom' },
      ],
      indexPattern as unknown as IndexPattern,
    ) as Array<{ render: (value: string) => string }>;
    expect(plain.render('agent-1')).toBe('agent-1');
    expect(custom.render(timestamp)).toBe('custom');
  });
});
