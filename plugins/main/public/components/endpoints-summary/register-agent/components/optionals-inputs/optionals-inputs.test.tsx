import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import OptionalsInputs from './optionals-inputs';
import { UseFormReturn } from '../../../../common/form/types';

/* Only the texts around the fields are under test, so the form inputs render
just their footer. */
jest.mock('../../../../common/form', () => ({
  InputForm: ({ footer }: { footer?: React.ReactNode }) => <>{footer}</>,
}));
jest.mock('../../../../../kibana-services', () => ({
  ...(jest.requireActual('../../../../../kibana-services') as object),
  getUiSettings: jest.fn().mockReturnValue({ get: () => false }),
}));

const formFields = {
  sslVerification: { value: true },
  managerCa: { value: '' },
  agentName: { value: '' },
  agentGroups: { value: [] },
} as unknown as UseFormReturn['fields'];

const renderOptionals = (usesEnrollmentToken: boolean) =>
  render(
    <OptionalsInputs
      formFields={formFields}
      usesEnrollmentToken={usesEnrollmentToken}
    />,
  );

describe('OptionalsInputs', () => {
  /* With a token the agent bootstraps the manager CA itself, so pointing
  users at the system store would push them to turn verification off. */
  it('explains the token bootstrap when an enrollment token is used', () => {
    renderOptionals(true);
    expect(
      screen.getByText(/fetches the manager CA on first start and checks it/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/checks with the enrollment token/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/system CA store/)).not.toBeInTheDocument();
  });

  it('keeps the system CA store advice for the password flow', () => {
    renderOptionals(false);
    expect(
      screen.getByText(/system CA store is used, which only trusts/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/against the endpoint system CA store/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/enrollment token/)).not.toBeInTheDocument();
  });
});
