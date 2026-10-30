import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  WAZUH_FIM_FILES_PATTERN,
  WAZUH_FIM_PATTERN,
  WAZUH_FIM_REGISTRY_KEYS_PATTERN,
  WAZUH_FIM_REGISTRY_VALUES_PATTERN,
  WAZUH_FINDINGS_PATTERN,
} from '../../../../../../common/constants';
import { ButtonAboutFileIntegrityMonitoring } from './button-about-file-integrity-monitoring';

jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

describe('ButtonAboutFileIntegrityMonitoring', () => {
  it('explains the module and links to its docs and configuration guide', () => {
    render(<ButtonAboutFileIntegrityMonitoring />);
    fireEvent.click(
      screen.getByRole('button', { name: 'About File Integrity Monitoring' }),
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('Baseline');
    [
      [/documentation/, 'index.html'],
      [
        /How to configure File Integrity Monitoring/,
        'how-to-configure-fim.html',
      ],
    ].forEach(([name, page]) =>
      expect(screen.getByRole('link', { name })).toHaveAttribute(
        'href',
        `https://docs.example/user-manual/capabilities/file-integrity/${page}`,
      ),
    );
  });

  it('lists the index patterns that each tab reads', () => {
    render(<ButtonAboutFileIntegrityMonitoring />);
    fireEvent.click(
      screen.getByRole('button', { name: 'About File Integrity Monitoring' }),
    );

    const getIndices = (id: string) =>
      Array.from(
        screen
          .getByRole('dialog')
          .querySelectorAll(`[data-test-subj$="Index-${id}"]`),
      ).map(element => element.textContent);

    expect(screen.getByRole('dialog')).toHaveTextContent('Indices');
    expect(getIndices('dashboard')).toEqual([WAZUH_FIM_PATTERN]);
    expect(getIndices('inventory')).toEqual([
      WAZUH_FIM_FILES_PATTERN,
      WAZUH_FIM_REGISTRY_KEYS_PATTERN,
      WAZUH_FIM_REGISTRY_VALUES_PATTERN,
    ]);
    expect(getIndices('findings')).toEqual([WAZUH_FINDINGS_PATTERN]);
  });
});
