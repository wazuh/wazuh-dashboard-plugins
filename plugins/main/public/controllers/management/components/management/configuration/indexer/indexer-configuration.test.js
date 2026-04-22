import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WzIndexer } from './indexer-configuration';

const basicIndexerConfig = {
  indexer: {
    hosts: ['https://os1:9200'],
    ssl: {
      certificate_authorities: [{ ca: ['/etc/server_certs/root-ca.pem'] }],
      certificate: ['/etc/server_certs/server.pem'],
      key: ['/etc/server_certs/server-key.pem'],
    },
  },
};

const multiHostIndexerConfig = {
  indexer: {
    hosts: ['https://os1:9200', 'https://os2:9200'],
    ssl: {
      certificate_authorities: [
        {
          ca: ['/etc/server_certs/root-ca.pem', '/etc/server_certs/alt-ca.pem'],
        },
      ],
      certificate: ['/etc/server_certs/server.pem'],
      key: ['/etc/server_certs/server-key.pem'],
    },
  },
};

describe('Indexer settings', () => {
  it('should render the indexer settings', () => {
    const { getByText } = render(
      <WzIndexer currentConfig={basicIndexerConfig} />,
    );

    expect(getByText('Hosts')).toBeInTheDocument();
    expect(getByText('SSL settings')).toBeInTheDocument();
    expect(getByText('Certificate authorities')).toBeInTheDocument();
    expect(getByText('Certificate')).toBeInTheDocument();
    expect(getByText('Key')).toBeInTheDocument();
  });

  it('should render multiple hosts', () => {
    const { getByText } = render(
      <WzIndexer currentConfig={multiHostIndexerConfig} />,
    );

    expect(getByText('Hosts')).toBeInTheDocument();
    expect(getByText('SSL settings')).toBeInTheDocument();
  });

  it('should render error when indexer config is empty', () => {
    const { getByText, queryByText } = render(
      <WzIndexer currentConfig={{ indexer: {} }} />,
    );

    expect(getByText('Configuration not available')).toBeInTheDocument();
    expect(queryByText('Hosts')).toBeFalsy();
  });

  it('should render error when indexer config is a string (error)', () => {
    const { getByText, queryByText } = render(
      <WzIndexer currentConfig={{ indexer: 'Fetch error message' }} />,
    );

    expect(getByText('Configuration not available')).toBeInTheDocument();
    expect(queryByText('Hosts')).toBeFalsy();
  });
});
