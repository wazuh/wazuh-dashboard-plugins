import { inventoryTableDefaultColumns } from '.';

describe('inventoryTableDefaultColumns', () => {
  it('shows the scanner condition right after the package version', () => {
    const ids = inventoryTableDefaultColumns.map(({ id }) => id);

    expect(ids.indexOf('vulnerability.scanner.condition')).toBe(
      ids.indexOf('package.version') + 1,
    );
  });
});
