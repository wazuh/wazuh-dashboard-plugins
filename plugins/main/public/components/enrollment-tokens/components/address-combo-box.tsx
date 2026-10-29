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

import React, { useEffect, useState } from 'react';
import { EuiComboBox, EuiComboBoxOptionOption } from '@elastic/eui';
import { getListenerCertificateNames } from '../../../services/enrollment-tokens';

interface AddressComboBoxProps {
  value: string;
  /* Called the way a text input is, so the form reads `event.target.value`. */
  onChange: (event: { target: { value: string } }) => void;
  isInvalid?: boolean;
  placeholder?: string;
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
}: AddressComboBoxProps) => {
  const { names, isLoading } = useListenerCertificateNames();
  const setValue = (address: string) =>
    onChange({ target: { value: address } });

  return (
    <EuiComboBox
      fullWidth
      placeholder={placeholder}
      singleSelection={{ asPlainText: true }}
      options={names.map(name => ({ label: name }))}
      selectedOptions={value ? [{ label: value }] : []}
      onChange={(selected: EuiComboBoxOptionOption[]) =>
        setValue(selected[0]?.label ?? '')
      }
      onCreateOption={(searchValue: string) => setValue(searchValue.trim())}
      isLoading={isLoading}
      isInvalid={isInvalid}
      data-test-subj='enrollmentTokenAddress'
    />
  );
};
