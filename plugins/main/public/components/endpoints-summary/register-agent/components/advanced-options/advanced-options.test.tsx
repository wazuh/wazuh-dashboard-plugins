import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import AdvancedOptions from './advanced-options';
import { EnhancedFieldConfiguration } from '../../../../common/form/types';

const defaultFormFieldData: EnhancedFieldConfiguration = {
  changed: true,
  value: '',
  error: null,
  currentValue: '',
  initialValue: '',
  type: 'text',
  onChange: () => {},
  setInputRef: () => {},
  inputRef: null,
};

const field = (
  value = '',
  error: string | null = null,
): EnhancedFieldConfiguration => ({
  ...defaultFormFieldData,
  value,
  currentValue: value,
  error,
});

const renderSection = (fields: EnhancedFieldConfiguration[]) =>
  render(
    <AdvancedOptions fields={fields}>
      <span>folded content</span>
    </AdvancedOptions>,
  );

const toggle = () => screen.getByRole('button', { name: /advanced options/ });
const content = () => screen.queryByText('folded content');

describe('AdvancedOptions', () => {
  it('starts folded when every field is empty and valid', () => {
    renderSection([field(''), field('')]);
    expect(content()).not.toBeInTheDocument();
    expect(toggle()).toHaveTextContent('View advanced options');
  });

  it('folds and unfolds on click', () => {
    renderSection([field('')]);
    fireEvent.click(toggle());
    expect(content()).toBeInTheDocument();
    expect(toggle()).toHaveTextContent('Hide advanced options');
    fireEvent.click(toggle());
    expect(content()).not.toBeInTheDocument();
  });

  /* A value already in one of the fields is in effect -- the endpoint's port
  and path prefix arrive from the app configuration -- so it must not sit
  behind a link the operator has no reason to click. */
  it('starts open when a field already carries a value', () => {
    renderSection([field(''), field('1517')]);
    expect(content()).toBeInTheDocument();
  });

  it('ignores a value that is only whitespace', () => {
    renderSection([field('   ')]);
    expect(content()).not.toBeInTheDocument();
  });

  it('starts open when a field is already in error', () => {
    renderSection([field('99999', 'The port is not valid.')]);
    expect(content()).toBeInTheDocument();
  });

  /* An error that cannot be seen cannot be corrected, and the deployment
  commands stay blocked until it is. */
  it('opens itself when an error appears while it is folded', () => {
    const { rerender } = renderSection([field('')]);
    expect(content()).not.toBeInTheDocument();

    rerender(
      <AdvancedOptions fields={[field('', 'The port is not valid.')]}>
        <span>folded content</span>
      </AdvancedOptions>,
    );
    expect(content()).toBeInTheDocument();
  });

  it('reports its state to assistive technology', () => {
    renderSection([field('')]);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle());
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
  });
});
