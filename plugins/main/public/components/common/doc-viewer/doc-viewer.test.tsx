import React from 'react';
import { render } from '@testing-library/react';
import DocViewer, { tDocViewerProps } from './doc-viewer';

jest.mock(
  '../../../../../../src/plugins/opensearch_dashboards_react/public',
  () => ({
    FieldIcon: () => null,
  }),
);

jest.mock('../data-grid/filter-cell-actions', () => ({
  onFilterCellActions: () => jest.fn(),
}));

const renderDocViewer = (formatted: Record<string, string>) => {
  const flattened = Object.fromEntries(
    Object.keys(formatted).map(field => [field, 'raw']),
  );
  const indexPattern = {
    id: 'pattern-1',
    fields: {
      getByName: () => ({ type: 'string' }),
      getAll: () => [],
    },
  };

  return render(
    <DocViewer
      flattened={flattened}
      formatted={formatted}
      mapping={() => ({ filterable: true, scripted: false })}
      indexPattern={indexPattern}
      renderFields={[] as unknown as tDocViewerProps['renderFields']}
      docJSON={{}}
      filters={[]}
      setFilters={jest.fn()}
      showFilterButtons={false}
    />,
  );
};

const getValue = (container: HTMLElement, field: string) =>
  container.querySelector(
    `[data-test-subj="tableDocViewRow-${field}-value"]`,
  ) as HTMLElement;

describe('DocViewer', () => {
  it('renders escaped HTML as text', () => {
    const { container } = renderDocViewer({
      'field.text': '&lt;b&gt;bold&lt;/b&gt;',
    });
    const value = getValue(container, 'field.text');

    expect(value.children).toHaveLength(0);
    expect(value.textContent).toBe('<b>bold</b>');
  });

  it('removes event handler attributes from the formatted value', () => {
    const { container } = renderDocViewer({
      'field.image': '<img src=x onerror=alert(1)>',
    });
    const value = getValue(container, 'field.image');

    expect(value.querySelector('[onerror]')).toBeNull();
  });

  it('keeps the links of the url formatter', () => {
    const { container } = renderDocViewer({
      'field.url':
        '<a href="https://x.example" target="_blank" rel="noopener noreferrer">x</a>',
    });
    const anchor = getValue(container, 'field.url').querySelector('a');

    expect(anchor?.getAttribute('href')).toBe('https://x.example');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
