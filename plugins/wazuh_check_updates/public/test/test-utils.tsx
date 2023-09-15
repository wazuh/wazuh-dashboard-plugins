import React from 'react';
import { IntlProvider } from 'react-intl';

export const TestProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <IntlProvider defaultLocale="en-US" locale="en-US">
      {children}
    </IntlProvider>
  );
};
