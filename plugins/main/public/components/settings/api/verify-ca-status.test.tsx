import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VerifyCaStatus } from './verify-ca-status';

const HTTPS = 'https://manager.local';

const bySubj = (subj: string) =>
  document.querySelector(`[data-test-subj="${subj}"]`) as HTMLElement;

const tooltipOf = async (element: HTMLElement) => {
  fireEvent.mouseOver(element);

  return (await screen.findByRole('tooltip', { hidden: true })).textContent;
};

describe('VerifyCaStatus', () => {
  it('shows a check mark when the certificate is verified', () => {
    const { container } = render(<VerifyCaStatus verifyCa url={HTTPS} />);

    expect(container.querySelector('[data-euiicon-type="check"]')).toBeTruthy();
    expect(screen.queryByText('Off')).not.toBeInTheDocument();
  });

  it('shows Off with a warning that names the ca setting when verification is off', async () => {
    render(<VerifyCaStatus verifyCa={false} url={HTTPS} />);

    const off = bySubj('verifyCaStatusOff');

    expect(off).toHaveTextContent('Off');
    expect(
      off.querySelector('[data-euiicon-type="alert"]'),
    ).toBeInTheDocument();
    expect(await tooltipOf(off)).toContain('Set ca for this host');
  });

  it('shows Off and says the connection is not encrypted for an HTTP host', async () => {
    render(<VerifyCaStatus verifyCa url='http://manager.local' />);

    expect(await tooltipOf(bySubj('verifyCaStatusOff'))).toContain(
      'not encrypted',
    );
  });

  it.each([undefined, null])(
    'keeps a separate rendering when the state is %p',
    async verifyCa => {
      render(<VerifyCaStatus verifyCa={verifyCa} url={HTTPS} />);

      const unknown = bySubj('verifyCaStatusUnknown');

      expect(unknown).toHaveTextContent('-');
      expect(screen.queryByText('Off')).not.toBeInTheDocument();
      expect(await tooltipOf(unknown)).toContain('could not be checked');
    },
  );
});
