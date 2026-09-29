/* eslint-disable camelcase -- the mock configuration reproduces the Server
API's field names verbatim. */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfigurationCards } from './configuration_cards';

const configuration = {
  hidden: false,
  name: 'node-01',
  node_name: 'worker-node',
  node_type: 'master',
  bind_addr: '0.0.0.0',
  nodes: ['10.0.0.1'],
  port: 1516,
};

describe('ConfigurationCards', () => {
  it('renders every configuration field with no unique-key console warning', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      render(
        <ConfigurationCards configuration={configuration} goBack={() => {}} />,
      );

      const hasKeyWarning = consoleError.mock.calls.some(args =>
        args.some(
          arg => typeof arg === 'string' && arg.includes('unique "key" prop'),
        ),
      );
      expect(hasKeyWarning).toBe(false);

      expect(screen.getByText('Hidden')).toBeInTheDocument();
      expect(screen.getByText('false')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('node-01')).toBeInTheDocument();
      expect(screen.getByText('Node name')).toBeInTheDocument();
      expect(screen.getByText('worker-node')).toBeInTheDocument();
      expect(screen.getByText('Node type')).toBeInTheDocument();
      expect(screen.getByText('master')).toBeInTheDocument();
      expect(screen.getByText('Bind address')).toBeInTheDocument();
      expect(screen.getByText('0.0.0.0')).toBeInTheDocument();
      expect(screen.getByText('IP')).toBeInTheDocument();
      expect(screen.getByText('10.0.0.1')).toBeInTheDocument();
      expect(screen.getByText('Port')).toBeInTheDocument();
      expect(screen.getByText('1516')).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });
});
