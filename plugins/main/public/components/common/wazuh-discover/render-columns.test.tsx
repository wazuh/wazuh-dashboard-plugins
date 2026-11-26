import React from 'react';
import { render } from '@testing-library/react';
import { wzDiscoverRenderColumns } from './render-columns';

jest.mock('../../wz-link/wz-link', () => ({
  WzLink: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

const MITRE_FIELDS = [
  'wazuh.rule.mitre.technique.id',
  'wazuh.rule.mitre.technique.name',
  'wazuh.rule.mitre.tactic.id',
  'wazuh.rule.mitre.tactic.name',
  'wazuh.rule.mitre.subtechnique.id',
  'wazuh.rule.mitre.subtechnique.name',
];

const renderField = (id: string, context?: string) => {
  const column = wzDiscoverRenderColumns.find(column => column.id === id);
  return render(
    <>{column?.render?.(['First value', 'Second value'], {}, { context })}</>,
  );
};

describe('wzDiscoverRenderColumns MITRE fields', () => {
  it.each(MITRE_FIELDS)(
    '%s renders a wrapping list in Document Details',
    field => {
      const { container } = renderField(field, 'doc-viewer');

      expect(container.querySelector('.wz-ellipsis')).toBeNull();
      expect(container.textContent).toBe('First value,Second value');
    },
  );

  it.each(MITRE_FIELDS)('%s keeps the ellipsis in the table', field => {
    const { container } = renderField(field);

    expect(container.querySelector('.wz-ellipsis')).not.toBeNull();
  });
});

const REFERENCE_FIELDS = [
  'vulnerability.reference',
  'vulnerability.scanner.reference',
  'data.vulnerability.reference',
  'data.vulnerability.scanner.reference',
];

const renderReference = (id: string, value: string) => {
  const column = wzDiscoverRenderColumns.find(column => column.id === id);
  return render(<>{column?.render?.(value, {})}</>);
};

describe('wzDiscoverRenderColumns reference fields', () => {
  it.each(REFERENCE_FIELDS)(
    '%s renders an https reference as a link',
    field => {
      const { container } = renderReference(field, 'https://a.example/x');
      const anchors = container.querySelectorAll('a');

      expect(anchors).toHaveLength(1);
      expect(anchors[0].getAttribute('href')).toBe('https://a.example/x');
    },
  );

  it.each(
    REFERENCE_FIELDS.flatMap(field =>
      [
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'myapp://open',
        'javascript:alert(1)',
      ].map(value => [field, value]),
    ),
  )('%s renders %s as text', (field, value) => {
    const { container } = renderReference(field, value);

    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toBe(value);
  });

  it.each(REFERENCE_FIELDS)(
    '%s links only the safe parts of a mixed value',
    field => {
      const value =
        'https://a.example/x, data:text/html,foo, http://b.example/y';
      const { container } = renderReference(field, value);
      const hrefs = Array.from(container.querySelectorAll('a')).map(anchor =>
        anchor.getAttribute('href'),
      );

      expect(hrefs).toEqual(['https://a.example/x', 'http://b.example/y']);
      expect(container.textContent).toContain(', data:text/html,foo, ');
      expect(container.textContent?.startsWith('https://a.example/x')).toBe(
        true,
      );
    },
  );

  it.each(REFERENCE_FIELDS)('%s renders - for an empty value', field => {
    const { container } = renderReference(field, '');

    expect(container.textContent).toBe('-');
  });
});
