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
