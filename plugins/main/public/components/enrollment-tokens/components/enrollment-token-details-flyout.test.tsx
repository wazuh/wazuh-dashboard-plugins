/* eslint-disable camelcase -- the Wazuh Server API listing is snake_case */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EnrollmentTokenDetailsFlyout } from './enrollment-token-details-flyout';
import { EnrollmentTokenSummary } from '../../../services/enrollment-tokens';

jest.mock('../../../react-services/time-service', () => ({
  formatUIDate: (date: string) => date,
}));

const TOKEN: EnrollmentTokenSummary = {
  id: 'token-id-1',
  address: 'wazuh-manager.example.com',
  created: '2026-09-01T00:00:00+00:00',
  expires: '2026-10-01T00:00:00+00:00',
  max_uses: 0,
  uses: 0,
  credential: true,
};

const renderFlyout = (token: Partial<EnrollmentTokenSummary> = {}) =>
  render(
    <EnrollmentTokenDetailsFlyout
      token={{ ...TOKEN, ...token }}
      onClose={jest.fn()}
    />,
  );

const descriptionValue = () =>
  document.querySelector('.wz-enrollment-token-description');

describe('EnrollmentTokenDetailsFlyout', () => {
  /* A description is prose, so it is read whole down the flyout rather than
  cut to one line with the rest behind a hover. */
  it('shows the whole description, wrapped rather than truncated', () => {
    const description =
      'Tokens minted for the Madrid data centre rollout, covering the Linux ' +
      'fleet that is being migrated off the old manager this quarter';
    renderFlyout({ description });

    expect(descriptionValue()).toHaveTextContent(description);
    /* The truncating control clips to one line with `white-space: nowrap`;
    the description must not be wearing it. */
    expect(descriptionValue()).not.toHaveClass('wz-truncated-value-tooltip');
  });

  /* The id and the address have no spaces to break on, so they keep the
  one-line-with-a-tooltip treatment the description no longer uses. */
  it('keeps the id and the address truncated to one line', () => {
    renderFlyout();

    const truncated = [
      ...document.querySelectorAll('.wz-truncated-value-tooltip'),
    ].map(node => node.textContent);
    expect(truncated).toEqual(['token-id-1', 'wazuh-manager.example.com']);
  });

  it('falls back to a dash when there is no description', () => {
    renderFlyout({ description: null });

    expect(descriptionValue()).not.toBeInTheDocument();
    expect(screen.getByText('Description').nextSibling).toHaveTextContent('-');
  });
});
