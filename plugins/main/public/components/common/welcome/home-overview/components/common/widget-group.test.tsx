import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { WidgetGroup, WidgetGroupBody } from './widget-group';

const child = <div>widget body</div>;

describe('WidgetGroup', () => {
  it('renders the children and title when available', () => {
    render(
      <WidgetGroup status='available' title='My widget'>
        {child}
      </WidgetGroup>,
    );
    expect(screen.getByText('My widget')).toBeInTheDocument();
    expect(screen.getByText('widget body')).toBeInTheDocument();
  });

  it('still renders, with a placeholder when the dependency is unavailable', () => {
    const { container } = render(
      <WidgetGroup status='unavailable' title='My widget'>
        {child}
      </WidgetGroup>,
    );
    // Panel + title still render; the body shows a neutral placeholder, not content.
    expect(screen.getByText('My widget')).toBeInTheDocument();
    expect(
      container.querySelector('[data-test-subj="widget-group-unavailable"]'),
    ).toBeInTheDocument();
    expect(screen.queryByText('widget body')).not.toBeInTheDocument();
  });

  it('renders a "-" placeholder on a non-data state', () => {
    const { container } = render(
      <WidgetGroup status='unavailable' title='My widget' errorDisplay='dash'>
        {child}
      </WidgetGroup>,
    );
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.queryByText('widget body')).not.toBeInTheDocument();
    // Benign/unavailable stays plain: no danger styling.
    expect(
      container.querySelector('[data-euiicon-type="alert"]'),
    ).not.toBeInTheDocument();
  });

  it('renders a danger-colored "-" with an alert icon for errorDisplay="dash" on error (distinct from unavailable)', () => {
    const { container } = render(
      <WidgetGroup status='error' title='My widget' errorDisplay='dash'>
        {child}
      </WidgetGroup>,
    );
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.queryByText('widget body')).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-euiicon-type="alert"]'),
    ).toBeInTheDocument();
  });

  it('renders a warning-colored "-" (not danger) for errorDisplay="dash" on a permission-denied error', () => {
    const { container } = render(
      <WidgetGroup
        status='error'
        title='My widget'
        errorDisplay='dash'
        isPermissionDenied
      >
        {child}
      </WidgetGroup>,
    );
    const icon = container.querySelector('[data-euiicon-type="alert"]');
    expect(icon).toBeInTheDocument();
    expect(icon?.getAttribute('color')).toBe('warning');
  });

  it('shows a skeleton while loading and not the content', () => {
    const { container } = render(
      <WidgetGroup status='loading' title='My widget'>
        {child}
      </WidgetGroup>,
    );
    expect(
      container.querySelector('[data-test-subj="widget-group-loading"]'),
    ).toBeInTheDocument();
    expect(screen.queryByText('widget body')).not.toBeInTheDocument();
  });

  it('shows a contained error (distinct from unavailable) with the label', () => {
    const { container } = render(
      <WidgetGroup status='error' title='My widget' errorLabel='Boom'>
        {child}
      </WidgetGroup>,
    );
    expect(
      container.querySelector('[data-test-subj="widget-group-error"]'),
    ).toBeInTheDocument();
    expect(screen.getByText('Boom')).toBeInTheDocument();
    expect(screen.queryByText('widget body')).not.toBeInTheDocument();
    expect(container.querySelector('.euiCallOut--danger')).toBeInTheDocument();
  });

  it('shows a permission-denied error as a warning, not a danger, callout', () => {
    const { container } = render(
      <WidgetGroup
        status='error'
        title='My widget'
        errorLabel='No permission'
        isPermissionDenied
      >
        {child}
      </WidgetGroup>,
    );
    expect(screen.getByText('No permission')).toBeInTheDocument();
    expect(container.querySelector('.euiCallOut--warning')).toBeInTheDocument();
    expect(
      container.querySelector('.euiCallOut--danger'),
    ).not.toBeInTheDocument();
  });

  it('shows a specific message on unavailable (distinct from the generic "Not available")', () => {
    render(
      <WidgetGroup
        status='unavailable'
        title='My widget'
        errorLabel='Index pattern [id: wazuh-alerts-*] not found.'
      >
        {child}
      </WidgetGroup>,
    );
    expect(
      screen.getByText('Index pattern [id: wazuh-alerts-*] not found.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Not available')).not.toBeInTheDocument();
  });

  it('falls back to "Not available" on unavailable when no message is given', () => {
    render(
      <WidgetGroup status='unavailable' title='My widget'>
        {child}
      </WidgetGroup>,
    );
    expect(screen.getByText('Not available')).toBeInTheDocument();
  });

  it('adds a "Manage index patterns" link on unavailable when requested', () => {
    render(
      <WidgetGroup
        status='unavailable'
        title='My widget'
        errorLabel='Index pattern [id: wazuh-alerts-*] not found.'
        showManageIndexPatternsLink
      >
        {child}
      </WidgetGroup>,
    );
    expect(
      screen.getByRole('link', { name: 'Manage index patterns' }),
    ).toBeInTheDocument();
  });

  it('omits the "Manage index patterns" link on a plain error', () => {
    render(
      <WidgetGroup status='error' title='My widget' errorLabel='Boom'>
        {child}
      </WidgetGroup>,
    );
    expect(
      screen.queryByRole('link', { name: 'Manage index patterns' }),
    ).not.toBeInTheDocument();
  });

  it('renders a header link and fires its onClick', () => {
    const onClick = jest.fn();
    render(
      <WidgetGroup
        status='available'
        title='My widget'
        headerLink={{ label: 'Threat Hunting', onClick }}
      >
        {child}
      </WidgetGroup>,
    );
    fireEvent.click(screen.getByText('Threat Hunting'));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('WidgetGroupBody', () => {
  it('renders only the status content, without any panel or title chrome', () => {
    const { container } = render(
      <WidgetGroupBody status='available'>{child}</WidgetGroupBody>,
    );
    expect(screen.getByText('widget body')).toBeInTheDocument();
    expect(container.querySelector('.euiPanel')).not.toBeInTheDocument();
  });

  it('supports composing two independently-gated groups in one panel', () => {
    const { container } = render(
      <div>
        <WidgetGroupBody status='available'>
          <div>hero</div>
        </WidgetGroupBody>
        <WidgetGroupBody status='error' errorLabel='Feed unavailable'>
          <div>feed table</div>
        </WidgetGroupBody>
      </div>,
    );
    expect(screen.getByText('hero')).toBeInTheDocument();
    expect(screen.queryByText('feed table')).not.toBeInTheDocument();
    expect(screen.getByText('Feed unavailable')).toBeInTheDocument();
    expect(
      container.querySelectorAll('[data-test-subj="widget-group-error"]')
        .length,
    ).toBe(1);
  });
});
