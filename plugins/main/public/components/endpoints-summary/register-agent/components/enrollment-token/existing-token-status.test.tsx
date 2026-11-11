/* eslint-disable camelcase -- the Server API listing is snake_case */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import ExistingTokenStatus from './existing-token-status';
import { getEnrollmentToken } from '../../../../../services/enrollment-tokens';

jest.mock('../../../../../services/enrollment-tokens', () => ({
  ...jest.requireActual(
    '../../../../../services/enrollment-tokens/decode-enrollment-token',
  ),
  getEnrollmentToken: jest.fn(),
}));

jest.mock('../../../../../react-services/time-service', () => ({
  formatUIDate: (date?: string) => `formatted ${date}`,
}));

const lookupToken = getEnrollmentToken as jest.Mock;

const toBase64Url = (binary: string) =>
  btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const bytes = (count: number) =>
  String.fromCharCode(...Array.from({ length: count }, (_, i) => i));

/* The first 16 bytes of the key are the id: 0x00..0x0f. */
const TOKEN_ID = 'AAECAwQFBgcICQoLDA0ODw';
const PIN = toBase64Url(bytes(32));

const tokenFor = (adr: string, withKey = true) =>
  toBase64Url(
    JSON.stringify({
      ver: 1,
      adr,
      pin: PIN,
      ...(withKey ? { key: toBase64Url(bytes(32)) } : {}),
    }),
  );

const ACTIVE = {
  id: TOKEN_ID,
  address: 'manager.example.com',
  expires: '2999-01-01T00:00:00+00:00',
  max_uses: 5,
  uses: 2,
  revoked: false,
};

const renderStatus = (
  token = tokenFor('manager.example.com'),
  expectedEndpoint: { address?: string; port?: string; prefix?: string } = {
    address: 'manager.example.com',
  },
) =>
  render(
    <ExistingTokenStatus token={token} expectedEndpoint={expectedEndpoint} />,
  );

const finding = (id: string) =>
  document.querySelector(`[data-test-subj="existingTokenFinding-${id}"]`);

beforeEach(() => {
  lookupToken.mockReset();
  lookupToken.mockResolvedValue(ACTIVE);
});

describe('ExistingTokenStatus', () => {
  it('looks the token up by the id in its key', async () => {
    renderStatus();

    await screen.findByText('Using the token provided');
    expect(lookupToken).toHaveBeenCalledWith(TOKEN_ID);
  });

  it('says it is checking until the list answers', () => {
    lookupToken.mockReturnValue(new Promise(() => {}));
    renderStatus();

    expect(screen.getByText('Checking the token')).toBeInTheDocument();
  });

  it('shows what the list says of an active token, without a warning', async () => {
    renderStatus();

    await screen.findByText('Using the token provided');
    const details = document.querySelector(
      '[data-test-subj="existingTokenDetails"]',
    ) as HTMLElement;
    expect(details).toHaveTextContent(TOKEN_ID);
    expect(details).toHaveTextContent('manager.example.com:1517/wazuh-manager');
    expect(details).toHaveTextContent('formatted 2999-01-01T00:00:00+00:00');
    expect(details).toHaveTextContent('2 / 5');
    expect(
      document.querySelector('[data-test-subj^="existingTokenFinding"]'),
    ).toBeNull();
  });

  it.each([
    ['revoked', { revoked: true }, 'This token is revoked'],
    [
      'expired',
      { expires: '2000-01-01T00:00:00+00:00' },
      'This token has expired',
    ],
    ['exhausted', { uses: 5 }, 'This token has no enrollments left'],
  ])('warns about a %s token', async (_, change, title) => {
    lookupToken.mockResolvedValue({ ...ACTIVE, ...change });
    renderStatus();

    expect(await screen.findByText(title)).toBeInTheDocument();
    expect(finding('status')).toHaveTextContent(
      'agents installed with the command below will not enroll',
    );
  });

  it('warns about a token this manager does not list', async () => {
    lookupToken.mockResolvedValue(undefined);
    renderStatus();

    expect(
      await screen.findByText('This manager does not know this token'),
    ).toBeInTheDocument();
    expect(finding('unknown')).toHaveTextContent(TOKEN_ID);
  });

  it('says the status could not be checked when the list cannot be read', async () => {
    lookupToken.mockRejectedValue(new Error('Permission denied'));
    renderStatus();

    expect(
      await screen.findByText('The status of this token could not be checked'),
    ).toBeInTheDocument();
    expect(finding('failed')).toHaveTextContent('Permission denied');
    expect(screen.queryByText('2 / 5')).not.toBeInTheDocument();
  });

  it('warns when the token names another manager address', async () => {
    renderStatus(tokenFor('10.0.0.5:1515'), {
      address: 'manager.example.com',
      port: '1517',
    });

    await screen.findByText('Using the token provided');
    expect(finding('endpoint')).toHaveTextContent(
      'The token connects agents to 10.0.0.5:1515/wazuh-manager, but the server address step says manager.example.com:1517.',
    );
  });

  it('does not compare a port that was left empty', async () => {
    renderStatus(tokenFor('manager.example.com:1515'), {
      address: 'manager.example.com',
      port: '',
    });

    await screen.findByText('Using the token provided');
    expect(finding('endpoint')).toBeNull();
  });

  it('warns about text that is not a token, without looking it up', () => {
    renderStatus('not-a-token');

    expect(
      screen.getByText('This text cannot be read as an enrollment token'),
    ).toBeInTheDocument();
    expect(lookupToken).not.toHaveBeenCalled();
  });

  it('cannot check a token without a credential, and says why', () => {
    renderStatus(tokenFor('manager.example.com', false));

    expect(finding('no-credential')).toHaveTextContent(
      'This token carries no credential',
    );
    expect(screen.getByText('Using the token provided')).toBeInTheDocument();
    expect(lookupToken).not.toHaveBeenCalled();
  });

  it('never shows the answer about a token that was replaced', async () => {
    let answerFirst: (value: unknown) => void = () => {};
    lookupToken.mockReturnValueOnce(
      new Promise(resolve => {
        answerFirst = resolve;
      }),
    );
    lookupToken.mockReturnValueOnce(new Promise(() => {}));
    const { rerender } = renderStatus();

    const other = toBase64Url(
      JSON.stringify({
        ver: 1,
        adr: 'manager.example.com',
        pin: PIN,
        key: toBase64Url(String.fromCharCode(...Array(32).fill(1))),
      }),
    );
    rerender(
      <ExistingTokenStatus
        token={other}
        expectedEndpoint={{ address: 'manager.example.com' }}
      />,
    );
    answerFirst({ ...ACTIVE, revoked: true });

    await waitFor(() => expect(lookupToken).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Checking the token')).toBeInTheDocument();
    expect(screen.queryByText('This token is revoked')).not.toBeInTheDocument();
  });
});
