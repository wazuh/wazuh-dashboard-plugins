/*
 * Wazuh app - Address input suggesting the listener certificate names
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { getListenerCertificateNames } from '../../../services/enrollment-tokens';

interface AddressComboBoxProps {
  value: string;
  /* Called the way a text input is, so the form reads `event.target.value`. */
  onChange: (event: { target: { value: string } }) => void;
  isInvalid?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
  /* Called with the names once they are known, `[]` when they cannot be
  loaded, so the parent can compare the address against them. */
  onNamesLoaded?: (names: string[]) => void;
  'data-test-subj'?: string;
}

/* Without suggestions the input still takes any typed address. */
const useListenerCertificateNames = () => {
  const [names, setNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getListenerCertificateNames()
      .then(found => isMounted && setNames(found))
      .catch(() => isMounted && setNames([]))
      .finally(() => isMounted && setIsLoading(false));

    return () => {
      isMounted = false;
    };
  }, []);

  return { names, isLoading };
};

export const AddressComboBox = ({
  value,
  onChange,
  isInvalid,
  placeholder,
  fullWidth = true,
  onNamesLoaded,
  'data-test-subj': dataTestSubj = 'enrollmentTokenAddress',
}: AddressComboBoxProps) => {
  const { names, isLoading } = useListenerCertificateNames();

  useEffect(() => {
    if (!isLoading) {
      onNamesLoaded?.(names);
    }
  }, [isLoading, names, onNamesLoaded]);

  const comboBoxRef = useRef<EuiComboBox<string>>(null);

  const setValue = (address: string) =>
    onChange({ target: { value: address } });

  /* The wildcard names are not options (an agent cannot connect to one as it
  is), so each is offered as a pattern: choosing it leaves `.example.com` in
  the search box with the cursor in front, ready for the missing name. The
  search box is not controlled, hence the call on the combo box itself. */
  const wildcardNames = names.filter(name => name.startsWith('*.'));
  const fillPattern = (pattern: string) => {
    /* `onSearchChange` and `searchInputRefInstance` are members of the combo
    box instance that its typings do not declare. */
    const comboBox = comboBoxRef.current as unknown as {
      onSearchChange?: (searchValue: string) => void;
      searchInputRefInstance?: HTMLInputElement | null;
    } | null;

    setValue('');
    comboBox?.onSearchChange?.(pattern.slice(1));
    setTimeout(() => {
      const input = comboBox?.searchInputRefInstance;

      input?.focus();
      input?.setSelectionRange?.(0, 0);
    }, 0);
  };

  return (
    <>
      <EuiComboBox
        ref={comboBoxRef}
        fullWidth={fullWidth}
        placeholder={placeholder}
        singleSelection={{ asPlainText: true }}
        options={names
          .filter(name => !name.includes('*'))
          .map(name => ({ label: name }))}
        selectedOptions={value ? [{ label: value }] : []}
        onChange={(selected: EuiComboBoxOptionOption[]) =>
          setValue(selected[0]?.label ?? '')
        }
        onCreateOption={(searchValue: string) => setValue(searchValue.trim())}
        isLoading={isLoading}
        isInvalid={isInvalid}
        data-test-subj={dataTestSubj}
      />
      {wildcardNames.length > 0 && (
        <>
          <EuiSpacer size='s' />
          <EuiFlexGroup
            gutterSize='s'
            alignItems='center'
            responsive={false}
            wrap
            data-test-subj='addressWildcardPatterns'
          >
            <EuiFlexItem grow={false}>
              <EuiText size='xs' color='subdued'>
                {i18n.translate(
                  'wazuh.enrollmentTokens.addressComboBox.wildcardPatterns.label',
                  { defaultMessage: 'Also accepted, any name matching:' },
                )}
              </EuiText>
            </EuiFlexItem>
            {wildcardNames.map(pattern => (
              <EuiFlexItem key={pattern} grow={false}>
                <EuiBadge
                  color='primary'
                  onClick={() => fillPattern(pattern)}
                  onClickAriaLabel={i18n.translate(
                    'wazuh.enrollmentTokens.addressComboBox.wildcardPatterns.useAriaLabel',
                    {
                      defaultMessage: 'Use the {pattern} pattern',
                      values: { pattern },
                    },
                  )}
                  data-test-subj='addressWildcardPattern'
                >
                  {pattern}
                </EuiBadge>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </>
      )}
    </>
  );
};
