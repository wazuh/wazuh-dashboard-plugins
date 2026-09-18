import { manageAgentsColumns } from './columns';

describe('manageAgentsColumns', () => {
  it('gives every column an explicit percentage width', () => {
    // With tableLayout="fixed", a column with no explicit width derives
    // its proportion from the first rendered row, so an empty table sizes
    // its header differently than a populated one unless widths are pinned.
    const columns = manageAgentsColumns();

    expect(columns.length).toBeGreaterThan(0);
    columns.forEach(column => {
      expect(typeof column.width).toBe('string');
      expect(column.width).toMatch(/^\d+(\.\d+)?%$/);
    });

    const totalWidth = columns.reduce(
      (sum, column) => sum + parseFloat(column.width as string),
      0,
    );
    expect(totalWidth).toBeLessThanOrEqual(100);
  });

  it('sums to exactly 100% when fullWidth is requested, for a table with no extra columns appended', () => {
    const columns = manageAgentsColumns({ fullWidth: true });

    const totalWidth = columns.reduce(
      (sum, column) => sum + parseFloat(column.width as string),
      0,
    );
    expect(totalWidth).toBe(100);
  });
});
