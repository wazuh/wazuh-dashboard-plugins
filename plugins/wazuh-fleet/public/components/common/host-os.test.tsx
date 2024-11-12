import React from 'react';
import { render } from '@testing-library/react';
import { HostOS, HostOSProps } from './host-os';
import '@testing-library/jest-dom';

describe('HostOS', () => {
  const renderComponent = (props: Partial<HostOSProps> = {}) => {
    const defaultProps: HostOSProps = {
      os: {
        name: 'Linux',
        platform: 'linux',
        full: 'Linux 5.4.0-42-generic',
      },
    };
    return render(<HostOS {...defaultProps} {...props} />);
  };

  it('should render the correct icon for Linux', () => {
    const { container } = renderComponent();
    expect(container.querySelector('.fa-linux')).toBeInTheDocument();
  });

  it('should render the correct icon for Windows', () => {
    const { container } = renderComponent({
      os: { platform: 'windows', name: 'Windows', full: 'Windows 10' },
    });
    expect(container.querySelector('.fa-windows')).toBeInTheDocument();
  });

  it('should render the correct icon for macOS', () => {
    const { container } = renderComponent({
      os: { platform: 'darwin', name: 'macOS', full: 'macOS Catalina' },
    });
    expect(container.querySelector('.fa-apple')).toBeInTheDocument();
  });

  it('should render the full OS name', () => {
    const { getByText } = renderComponent();
    expect(getByText('Linux 5.4.0-42-generic')).toBeInTheDocument();
  });

  it('should render a dash if full OS name is not provided', () => {
    const { getByText } = renderComponent({
      os: { platform: 'linux', name: 'Linux', full: '' },
    });
    expect(getByText('-')).toBeInTheDocument();
  });
});
