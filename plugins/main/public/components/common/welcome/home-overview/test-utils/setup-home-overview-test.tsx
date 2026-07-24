import React from 'react';

jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: jest.fn(() => ({
    handleError: jest.fn(),
  })),
}));

jest.mock('../../../../../kibana-services', () => ({
  getCore: jest.fn(() => ({
    application: {
      getUrlForApp: jest.fn(() => '/mock-url'),
    },
  })),
}));

jest.mock(
  '../../../../../../../../src/plugins/opensearch_dashboards_react/public',
  () => ({
    RedirectAppLinks: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  }),
);

export {};
