/*
 * Wazuh app - Flyout to mint an enrollment token
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCode,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiForm,
  EuiFormRow,
  EuiSpacer,
  EuiSwitch,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { WzFlyout } from '../../common/flyouts';
import { InputForm } from '../../common/form';
import { useForm } from '../../common/form/hooks';
import { FormConfiguration } from '../../common/form/types';
import { getWazuhCorePlugin } from '../../../kibana-services';
import { formatUIDate } from '../../../react-services/time-service';
import {
  createEnrollmentToken,
  MintedEnrollmentToken,
  validateEnrollmentTokenMaxUses,
  validateEnrollmentTokenTtl,
} from '../../../services/enrollment-tokens';
import { TruncatedValuePopover } from './truncated-value-popover';

interface CreateEnrollmentTokenFlyoutProps {
  /* Called with `true` once a token was minted, so the listing behind the
  flyout is only refreshed when there is something new to show. */
  onClose: (minted: boolean) => void;
}

export const CreateEnrollmentTokenFlyout = ({
  onClose,
}: CreateEnrollmentTokenFlyoutProps) => {
  const configuration = useSelector(
    (state: { appConfig: { data?: Record<string, string> } }) =>
      state.appConfig.data ?? {},
  );
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mintedToken, setMintedToken] = useState<MintedEnrollmentToken | null>(
    null,
  );
  /* Not part of the validated form state: a plain boolean with no validation
  of its own. */
  const [noCredential, setNoCredential] = useState(false);

  const initialFields: FormConfiguration = {
    address: {
      type: 'text',
      initialValue: configuration['enrollment.dns'] || '',
      validate: getWazuhCorePlugin().SettingsValidator.serverEndpointAddress,
    },
    port: {
      type: 'text',
      initialValue: '',
      validate: getWazuhCorePlugin().SettingsValidator.serverEndpointPort,
    },
    prefix: {
      type: 'text',
      initialValue: '',
      validate: getWazuhCorePlugin().SettingsValidator.serverEndpointPathPrefix,
    },
    ttl: {
      type: 'text',
      initialValue: '',
      validate: validateEnrollmentTokenTtl,
    },
    maxUses: {
      type: 'number',
      initialValue: '',
      validate: validateEnrollmentTokenMaxUses,
    },
    description: {
      type: 'text',
      initialValue: '',
    },
  };

  const { fields, errors } = useForm(initialFields);

  const addressIsMissing =
    String(fields.address?.value ?? '').trim().length === 0;
  const formIsInvalid = addressIsMissing || Object.keys(errors).length > 0;

  const onCreate = async () => {
    setIsMinting(true);
    setError(null);
    try {
      const token = await createEnrollmentToken({
        address: fields.address.value,
        port: fields.port.value,
        prefix: fields.prefix.value,
        ttl: fields.ttl.value,
        maxUses: fields.maxUses.value,
        description: fields.description.value,
        noCredential,
      });

      setMintedToken(token);
    } catch (requestError) {
      /* Whatever the manager answered is shown as it wrote it. It is the
      manager that checks the address against the names in its listener
      certificate, and a second rule computed here would drift from the one it
      actually enforces. */
      setError(
        requestError?.message || 'The enrollment token could not be created.',
      );
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <WzFlyout
      onClose={() => onClose(Boolean(mintedToken))}
      flyoutProps={{
        size: 'm',
        'aria-labelledby': 'createEnrollmentTokenFlyoutTitle',
      }}
    >
      <EuiFlyoutHeader hasBorder={false}>
        <EuiTitle size='m'>
          <h2 id='createEnrollmentTokenFlyoutTitle'>
            {mintedToken
              ? 'Enrollment token created'
              : 'Create enrollment token'}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        {mintedToken ? (
          <>
            <EuiCallOut
              title='Copy the token now'
              color='warning'
              iconType='alert'
            >
              <p>
                The token text is returned once and is never listed again. A
                token that is not kept here cannot be recovered, and a new one
                has to be created instead.
              </p>
            </EuiCallOut>
            <EuiSpacer size='m' />
            <EuiDescriptionList
              compressed
              type='column'
              listItems={[
                {
                  title: 'Token',
                  description: (
                    <TruncatedValuePopover value={mintedToken.token} />
                  ),
                },
                { title: 'ID', description: mintedToken.id },
                { title: 'Address', description: mintedToken.address },
                {
                  title: 'Expires',
                  description: formatUIDate(mintedToken.expires),
                },
              ]}
            />
          </>
        ) : (
          <EuiForm component='form' isInvalid={Boolean(error)} error={error}>
            <InputForm
              {...fields.address}
              label='Address'
              footer={
                <EuiText size='xs' color='subdued'>
                  The name agents connect to. It must be one of the names in the
                  manager listener certificate; an address outside it is
                  refused.
                </EuiText>
              }
              placeholder='wazuh-manager.example.com'
            />
            <InputForm
              {...fields.port}
              label={
                <span>
                  Port - <em>optional</em>
                </span>
              }
              footer={
                <EuiText size='xs' color='subdued'>
                  Written into the token when it differs from the port the
                  manager is configured with.
                </EuiText>
              }
              placeholder='1517'
            />
            <InputForm
              {...fields.prefix}
              label={
                <span>
                  Path prefix - <em>optional</em>
                </span>
              }
              footer={
                <EuiText size='xs' color='subdued'>
                  Written into the token when it differs from the prefix the
                  manager is configured with.
                </EuiText>
              }
              placeholder='/wazuh-manager'
            />
            <InputForm
              {...fields.ttl}
              label={
                <span>
                  Lifetime - <em>optional</em>
                </span>
              }
              footer={
                <EuiText size='xs' color='subdued'>
                  Seconds, or a number followed by <EuiCode>d</EuiCode>,{' '}
                  <EuiCode>h</EuiCode>, <EuiCode>m</EuiCode> or{' '}
                  <EuiCode>s</EuiCode>. Left empty, the server applies its
                  default of 30 days.
                </EuiText>
              }
              placeholder='30d'
            />
            <InputForm
              {...fields.maxUses}
              label={
                <span>
                  Enrollments allowed - <em>optional</em>
                </span>
              }
              footer={
                <EuiText size='xs' color='subdued'>
                  How many agents the token can enroll. Left empty, or set to 0,
                  the token allows unlimited enrollments.
                </EuiText>
              }
              placeholder='0'
            />
            <InputForm
              {...fields.description}
              label={
                <span>
                  Description - <em>optional</em>
                </span>
              }
              footer={
                <EuiText size='xs' color='subdued'>
                  Free text shown in the listing so the token can be told apart
                  from the others.
                </EuiText>
              }
            />
            <EuiSpacer size='m' />
            <EuiFormRow
              label='Without credential'
              helpText='Mints a token carrying only the address and the pin. It can point an agent at the manager but cannot authenticate its enrollment.'
              fullWidth
            >
              <EuiSwitch
                label='Mint the token without a credential'
                checked={noCredential}
                onChange={event => setNoCredential(event.target.checked)}
              />
            </EuiFormRow>
          </EuiForm>
        )}
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent='spaceBetween'>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              iconType='cross'
              onClick={() => onClose(Boolean(mintedToken))}
              flush='left'
            >
              {mintedToken ? 'Close' : 'Cancel'}
            </EuiButtonEmpty>
          </EuiFlexItem>
          {!mintedToken && (
            <EuiFlexItem grow={false}>
              <EuiButton
                fill
                isLoading={isMinting}
                isDisabled={formIsInvalid || isMinting}
                onClick={onCreate}
              >
                Create
              </EuiButton>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </WzFlyout>
  );
};
