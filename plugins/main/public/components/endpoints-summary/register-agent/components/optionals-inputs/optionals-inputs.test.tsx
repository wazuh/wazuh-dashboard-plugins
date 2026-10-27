import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import OptionalsInputs from './optionals-inputs';
import { UseFormReturn } from '../../../../common/form/types';

/* Only the texts around the fields are under test, so the form inputs render
just their footer and placeholder. */
jest.mock('../../../../common/form', () => ({
  InputForm: ({
    footer,
    placeholder,
  }: {
    footer?: React.ReactNode;
    placeholder?: string;
  }) => (
    <>
      {placeholder}
      {footer}
    </>
  ),
}));
jest.mock('../../../../../kibana-services', () => ({
  ...(jest.requireActual('../../../../../kibana-services') as object),
  getUiSettings: jest.fn().mockReturnValue({ get: () => false }),
}));

const formFields = {
  sslVerification: { value: true },
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
  it('explains the token bootstrap when an enrollment token is used', () => {
    renderOptionals(true);
    expect(
      screen.getByText(/checks with the enrollment token\. The deployment/),
    ).toBeInTheDocument();
  });

  it('points to a CA placed by hand for the password flow', () => {
    renderOptionals(false);
    expect(
      screen.getByText(/only against a manager CA placed on the endpoint/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/enrollment token/)).not.toBeInTheDocument();
  });

  /* The 5.0 installer ignores WAZUH_REGISTRATION_CA, so no CA path is asked. */
  it.each([true, false])(
    'offers no manager CA path (token: %p)',
    usesEnrollmentToken => {
      renderOptionals(usesEnrollmentToken);
      expect(screen.queryByText(/manager-ca\.pem/)).not.toBeInTheDocument();
      expect(screen.queryByText(/CA file/)).not.toBeInTheDocument();
    },
  );
});
