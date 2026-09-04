import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusCallout } from './status-callout';

describe('StatusCallout', () => {
  it('renders the title and body content', () => {
    render(
      <StatusCallout
        title='Session expired'
        body='Please reload the page to sign in again.'
        color='warning'
        iconType='alert'
      />,
    );

    expect(screen.getByText('Session expired')).toBeInTheDocument();
    expect(
      screen.getByText('Please reload the page to sign in again.'),
    ).toBeInTheDocument();
  });

  it('applies the given color and iconType to the underlying EuiCallOut', () => {
    const { container } = render(
      <StatusCallout
        title='Something went wrong'
        body='detail'
        color='danger'
        iconType='alert'
      />,
    );

    expect(container.querySelector('.euiCallOut--danger')).not.toBeNull();
    expect(container.querySelector('.euiCallOutHeader__icon')).not.toBeNull();
  });

  it('renders the action node right after the body when provided', () => {
    render(
      <StatusCallout
        title='Providers unavailable'
        body='Could not load providers.'
        color='danger'
        iconType='alert'
        action={<button type='button'>Retry</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('renders no action when none is supplied', () => {
    render(
      <StatusCallout
        title='Info'
        body='detail'
        color='primary'
        iconType='iInCircle'
      />,
    );

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a trailing spacer by default (spaced is unset)', () => {
    const { container } = render(
      <StatusCallout title='t' body='b' color='primary' iconType='alert' />,
    );

    expect(container.querySelector('.euiSpacer')).not.toBeNull();
  });

  it('omits the trailing spacer when spaced is explicitly false', () => {
    const { container } = render(
      <StatusCallout
        title='t'
        body='b'
        color='primary'
        iconType='alert'
        spaced={false}
      />,
    );

    expect(container.querySelector('.euiSpacer')).toBeNull();
  });

  it('renders a ReactNode body directly, without wrapping it in a <p> (avoids invalid nested block markup)', () => {
    const { container } = render(
      <StatusCallout
        title='Something went wrong'
        body={
          <div data-test-subj='wzRichBody'>
            <a href='https://example.com/billing'>Add credits</a>
          </div>
        }
        color='danger'
        iconType='alert'
      />,
    );

    const rich = container.querySelector('[data-test-subj="wzRichBody"]');
    expect(rich).toBeInTheDocument();
    expect(rich.closest('p')).toBeNull();
    expect(
      container.querySelector('a[href="https://example.com/billing"]'),
    ).not.toBeNull();
  });
});
