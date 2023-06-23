import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { RegisterAgent } from './register-agent';

describe('RegisterAgent', () => {
  test('renders the component', () => {
    const mockHasAgents = jest.fn();

    render(<RegisterAgent hasAgents={mockHasAgents} />);

    // Verifica que el título esté presente
    const titleElement = screen.getByText('Deploy new agent');
    expect(titleElement).toBeInTheDocument();

    // Verifica que el componente InputForm esté presente
    const component = screen.getByTestId('os-card');
    expect(component).toBeInTheDocument();
  });
});
