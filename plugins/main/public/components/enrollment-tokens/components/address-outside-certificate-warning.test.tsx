import React from 'react';
import { render } from '@testing-library/react';
import { useForm } from '../../common/form/hooks';
import {
  getCoveringWildcardName,
  matchesCertificateName,
  useClearPrefilledAddressOutsideCertificate,
} from './address-outside-certificate-warning';

describe('matchesCertificateName', () => {
  it('matches an exact name ignoring case', () => {
    expect(matchesCertificateName('Wazuh.Example', 'wazuh.example')).toBe(true);
    expect(matchesCertificateName('wazuh.example', 'other.example')).toBe(
      false,
    );
  });

  it('matches one leading label against a wildcard', () => {
    expect(matchesCertificateName('*.acme.example', 'wazuh.acme.example')).toBe(
      true,
    );
    expect(matchesCertificateName('*.acme.example', 'WAZUH.acme.example')).toBe(
      true,
    );
  });

  it('does not match more or fewer labels than the wildcard covers', () => {
    expect(matchesCertificateName('*.acme.example', 'a.b.acme.example')).toBe(
      false,
    );
    expect(matchesCertificateName('*.acme.example', 'acme.example')).toBe(
      false,
    );
    expect(matchesCertificateName('*.acme.example', '.acme.example')).toBe(
      false,
    );
  });
});

describe('getCoveringWildcardName', () => {
  const names = ['wazuh.manager.local', '*.acme.example'];

  it('returns the wildcard that covers the address', () => {
    expect(getCoveringWildcardName('wazuh.acme.example', names)).toBe(
      '*.acme.example',
    );
  });

  it('returns nothing for an exact name, an uncovered address or a pattern', () => {
    expect(getCoveringWildcardName('wazuh.manager.local', names)).toBe(
      undefined,
    );
    expect(getCoveringWildcardName('a.b.acme.example', names)).toBe(undefined);
    expect(getCoveringWildcardName('*.acme.example', names)).toBe(undefined);
    expect(getCoveringWildcardName('', names)).toBe(undefined);
  });

  it('returns nothing when an exact name also covers the address', () => {
    expect(
      getCoveringWildcardName('wazuh.acme.example', [
        'wazuh.acme.example',
        '*.acme.example',
      ]),
    ).toBe(undefined);
  });
});

describe('useClearPrefilledAddressOutsideCertificate', () => {
  let address: unknown;
  const onCleared = jest.fn();

  const Harness = ({
    prefill,
    names,
    typed,
  }: {
    prefill: string;
    names: string[];
    typed?: string;
  }) => {
    const { fields } = useForm({
      address: { type: 'text', initialValue: prefill },
    });
    address = fields.address.value;
    React.useEffect(() => {
      if (typed !== undefined) {
        fields.address.onChange({ target: { value: typed } });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useClearPrefilledAddressOutsideCertificate(
      fields.address,
      names,
      onCleared,
    );
    return null;
  };

  beforeEach(() => onCleared.mockReset());

  it('clears a prefilled address outside the certificate once', () => {
    const { rerender } = render(<Harness prefill='old.example' names={[]} />);
    expect(address).toBe('old.example');

    rerender(<Harness prefill='old.example' names={['manager.example']} />);
    expect(address).toBe('');
    expect(onCleared).toHaveBeenCalledTimes(1);
  });

  it('keeps a prefilled address in the certificate', () => {
    render(<Harness prefill='wazuh.acme.example' names={['*.acme.example']} />);

    expect(address).toBe('wazuh.acme.example');
    expect(onCleared).not.toHaveBeenCalled();
  });

  it('keeps an address entered before the names loaded', () => {
    const { rerender } = render(
      <Harness prefill='old.example' names={[]} typed='typed.example' />,
    );

    rerender(
      <Harness
        prefill='old.example'
        names={['manager.example']}
        typed='typed.example'
      />,
    );
    expect(address).toBe('typed.example');
    expect(onCleared).not.toHaveBeenCalled();
  });
});
