import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  TabNumber,
  ErrorValuePlaceholder,
  formatValueSafely,
} from './tab-number';

const ERROR_ICON = '[data-euiicon-type="alert"]';

describe('TabNumber', () => {
  it('renders the formatted value when present', () => {
    render(<TabNumber value={1234} />);
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders a plain "-" when the value is missing and there is no error', () => {
    const { container } = render(<TabNumber value={undefined} />);
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(container.querySelector(ERROR_ICON)).not.toBeInTheDocument();
  });

  it('renders a danger-colored "-" with an alert icon when errorTooltip is set', () => {
    const { container } = render(
      <TabNumber value={undefined} errorTooltip='Could not load Packages' />,
    );
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(container.querySelector(ERROR_ICON)).toBeInTheDocument();
  });

  it('ignores errorTooltip when a value is present', () => {
    const { container } = render(
      <TabNumber value={5} errorTooltip='Could not load Packages' />,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(container.querySelector(ERROR_ICON)).not.toBeInTheDocument();
  });

  it('renders a neutral "-" (no alert icon) with a tooltip when infoTooltip is set', () => {
    const { container } = render(
      <TabNumber value={undefined} infoTooltip='Index pattern not found' />,
    );
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(container.querySelector(ERROR_ICON)).not.toBeInTheDocument();
  });

  it('prefers errorTooltip over infoTooltip when both are set', () => {
    const { container } = render(
      <TabNumber
        value={undefined}
        errorTooltip='Could not load Packages'
        infoTooltip='Index pattern not found'
      />,
    );
    expect(container.querySelector(ERROR_ICON)).toBeInTheDocument();
  });

  it('ignores infoTooltip when a value is present', () => {
    const { container } = render(
      <TabNumber value={5} infoTooltip='Index pattern not found' />,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(container.querySelector(ERROR_ICON)).not.toBeInTheDocument();
  });

  it('renders a warning-colored icon for a permission-denied errorColor', () => {
    const { container } = render(
      <TabNumber
        value={undefined}
        errorTooltip='No permission'
        errorColor='warning'
      />,
    );
    const icon = container.querySelector(ERROR_ICON);
    expect(icon?.getAttribute('color')).toBe('warning');
  });

  it('defaults to a danger-colored icon when errorColor is not given', () => {
    const { container } = render(
      <TabNumber value={undefined} errorTooltip='Could not load Packages' />,
    );
    const icon = container.querySelector(ERROR_ICON);
    expect(icon?.getAttribute('color')).toBe('danger');
  });
});

describe('ErrorValuePlaceholder', () => {
  it('renders the danger-colored dash with an alert icon', () => {
    const { container } = render(<ErrorValuePlaceholder tooltip='Boom' />);
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(container.querySelector(ERROR_ICON)).toBeInTheDocument();
  });

  it('defaults to a generic tooltip message', () => {
    const { container } = render(<ErrorValuePlaceholder />);
    expect(container.querySelector(ERROR_ICON)).toBeInTheDocument();
  });

  it('renders a warning color when color="warning" is passed', () => {
    const { container } = render(
      <ErrorValuePlaceholder tooltip='No permission' color='warning' />,
    );
    const icon = container.querySelector(ERROR_ICON);
    expect(icon?.getAttribute('color')).toBe('warning');
  });
});

describe('formatValueSafely', () => {
  it('returns "-" for an undefined value', () => {
    expect(formatValueSafely(undefined)).toBe('-');
  });

  it('formats a defined value', () => {
    expect(formatValueSafely(1234)).toBe('1,234');
  });
});
