import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders nothing when the dependency is unavailable (hide)', () => {
    const { container } = render(
      <WidgetGroup status='unavailable' title='My widget'>
        {child}
      </WidgetGroup>,
    );
    expect(container).toBeEmptyDOMElement();
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
