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

import { i18n } from '@osd/i18n';
import React, { useState } from 'react';
import { FormattedMessage } from '@osd/i18n/react';
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
import {
  UnsavedChangesGuardedFlyout,
  useReportUnsavedChanges,
  useUnsavedChangesGuard,
} from '../../common/unsaved-changes-guard';
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

interface CreateEnrollmentTokenFlyoutContentProps {
  mintedToken: MintedEnrollmentToken | null;
  onMinted: (token: MintedEnrollmentToken) => void;
  onClose: () => void;
}

/* The header, the body and the footer live below the guarded flyout because
only a descendant can report unsaved changes to it and guard its own close
actions against them. */
const CreateEnrollmentTokenFlyoutContent = ({
  mintedToken,
  onMinted,
  onClose,
}: CreateEnrollmentTokenFlyoutContentProps) => {
  const configuration = useSelector(
    (state: { appConfig: { data?: Record<string, string> } }) =>
      state.appConfig.data ?? {},
  );
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* Not part of the validated form state: plain booleans with no validation of
  their own. */
  const [embedCa, setEmbedCa] = useState(false);
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

  const { fields, errors, changed } = useForm(initialFields);
  const { guardAction } = useUnsavedChangesGuard();

  /* A field moved away from the value it was offered with, or either switch
  turned on, is work that closing the flyout would throw away. Once the token
  is minted the form is gone and there is nothing left to lose, so the
  confirmation stops getting in the way of the one screen the user has to close
  to carry on. */
  const hasUnsavedChanges =
    !mintedToken &&
    (Object.keys(changed).length > 0 || embedCa || noCredential);

  useReportUnsavedChanges(hasUnsavedChanges);

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
        embedCa,
        noCredential,
      });

      onMinted(token);
    } catch (requestError) {
      /* Whatever the manager answered is shown as it wrote it. It is the
      manager that checks the address against the names in its listener
      certificate, and a second rule computed here would drift from the one it
      actually enforces. */
      setError(
        requestError?.message ||
          i18n.translate(
            'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.createError',
            {
              defaultMessage: 'The enrollment token could not be created.',
            },
          ),
      );
    } finally {
      setIsMinting(false);
    }
  };

  const optionalMarker = (
    <em>
      {i18n.translate(
        'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.optionalMarker',
        {
          defaultMessage: 'optional',
        },
      )}
    </em>
  );

  return (
    <>
      <EuiFlyoutHeader hasBorder={false}>
        <EuiTitle size='m'>
          <h2 id='createEnrollmentTokenFlyoutTitle'>
            {mintedToken
              ? i18n.translate(
                  'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.createdTitle',
                  {
                    defaultMessage: 'Enrollment token created',
                  },
                )
              : i18n.translate(
                  'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.title',
                  {
                    defaultMessage: 'Create enrollment token',
                  },
                )}
          </h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        {mintedToken ? (
          <>
            <EuiCallOut
              title={i18n.translate(
                'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.copyNowTitle',
                {
                  defaultMessage: 'Copy the token now',
                },
              )}
              color='warning'
              iconType='alert'
            >
              <p>
                {i18n.translate(
                  'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.copyNowBody',
                  {
                    defaultMessage:
                      'The token text is returned once and is never listed again. A token that is not kept here cannot be recovered, and a new one has to be created instead.',
                  },
                )}
              </p>
            </EuiCallOut>
            <EuiSpacer size='m' />
            {/* Stacked, the same way the details flyout reads: the label sits
            above its value so a token, an id or an address gets the width of
            the flyout rather than what is left beside a label column. */}
            <EuiDescriptionList
              compressed
              type='row'
              listItems={[
                {
                  title: i18n.translate(
                    'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.mintedTokenLabel',
                    {
                      defaultMessage: 'Token',
                    },
                  ),
                  description: (
                    <TruncatedValuePopover value={mintedToken.token} />
                  ),
                },
                {
                  title: i18n.translate(
                    'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.mintedIdLabel',
                    {
                      defaultMessage: 'ID',
                    },
                  ),
                  description: mintedToken.id,
                },
                {
                  title: i18n.translate(
                    'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.mintedAddressLabel',
                    {
                      defaultMessage: 'Address',
                    },
                  ),
                  description: mintedToken.address,
                },
                {
                  title: i18n.translate(
                    'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.mintedExpiresLabel',
                    {
                      defaultMessage: 'Expires',
                    },
                  ),
                  description: formatUIDate(mintedToken.expires),
                },
              ]}
            />
          </>
        ) : (
          <EuiForm component='form' isInvalid={Boolean(error)} error={error}>
            <InputForm
              {...fields.address}
              label={i18n.translate(
                'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.addressLabel',
                {
                  defaultMessage: 'Address',
                },
              )}
              footer={
                <EuiText size='xs' color='subdued'>
                  {i18n.translate(
                    'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.addressHelp',
                    {
                      defaultMessage:
                        'The name agents connect to. It must be one of the names in the manager listener certificate; an address outside it is refused.',
                    },
                  )}
                </EuiText>
              }
              placeholder='wazuh-manager.example.com'
            />
            <InputForm
              {...fields.port}
              label={
                <span>
                  <FormattedMessage
                    id='wazuh.enrollmentTokens.createEnrollmentTokenFlyout.portLabel'
                    defaultMessage='Port - {optional}'
                    values={{ optional: optionalMarker }}
                  />
                </span>
              }
              footer={
                <EuiText size='xs' color='subdued'>
                  {i18n.translate(
                    'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.portHelp',
                    {
                      defaultMessage:
                        'Written into the token when it differs from the port the manager is configured with.',
                    },
                  )}
                </EuiText>
              }
              placeholder='1517'
            />
            <InputForm
              {...fields.prefix}
              label={
                <span>
                  <FormattedMessage
                    id='wazuh.enrollmentTokens.createEnrollmentTokenFlyout.prefixLabel'
                    defaultMessage='Path prefix - {optional}'
                    values={{ optional: optionalMarker }}
                  />
                </span>
              }
              footer={
                <EuiText size='xs' color='subdued'>
                  {i18n.translate(
                    'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.prefixHelp',
                    {
                      defaultMessage:
                        'Written into the token when it differs from the prefix the manager is configured with.',
                    },
                  )}
                </EuiText>
              }
              placeholder='/wazuh-manager/'
            />
            <InputForm
              {...fields.ttl}
              label={
                <span>
                  <FormattedMessage
                    id='wazuh.enrollmentTokens.createEnrollmentTokenFlyout.ttlLabel'
                    defaultMessage='Lifetime - {optional}'
                    values={{ optional: optionalMarker }}
                  />
                </span>
              }
              footer={
                <EuiText size='xs' color='subdued'>
                  <FormattedMessage
                    id='wazuh.enrollmentTokens.createEnrollmentTokenFlyout.ttlHelp'
                    defaultMessage='Seconds, or a number followed by {days}, {hours}, {minutes} or {seconds}. Left empty, the server applies its default of 30 days.'
                    values={{
                      days: <EuiCode>d</EuiCode>,
                      hours: <EuiCode>h</EuiCode>,
                      minutes: <EuiCode>m</EuiCode>,
                      seconds: <EuiCode>s</EuiCode>,
                    }}
                  />
                </EuiText>
              }
              placeholder='30d'
            />
            <InputForm
              {...fields.maxUses}
              label={
                <span>
                  <FormattedMessage
                    id='wazuh.enrollmentTokens.createEnrollmentTokenFlyout.maxUsesLabel'
                    defaultMessage='Enrollments allowed - {optional}'
                    values={{ optional: optionalMarker }}
                  />
                </span>
              }
              footer={
                <EuiText size='xs' color='subdued'>
                  {i18n.translate(
                    'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.maxUsesHelp',
                    {
                      defaultMessage:
                        'How many agents the token can enroll. Left empty, or set to 0, the token allows unlimited enrollments.',
                    },
                  )}
                </EuiText>
              }
              placeholder='0'
            />
            <InputForm
              {...fields.description}
              label={
                <span>
                  <FormattedMessage
                    id='wazuh.enrollmentTokens.createEnrollmentTokenFlyout.descriptionLabel'
                    defaultMessage='Description - {optional}'
                    values={{ optional: optionalMarker }}
                  />
                </span>
              }
              footer={
                <EuiText size='xs' color='subdued'>
                  {i18n.translate(
                    'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.descriptionHelp',
                    {
                      defaultMessage:
                        'Free text shown in the listing so the token can be told apart from the others.',
                    },
                  )}
                </EuiText>
              }
            />
            <EuiSpacer size='m' />
            <EuiFormRow
              label={i18n.translate(
                'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.embedCaLabel',
                {
                  defaultMessage: 'Embed CA',
                },
              )}
              helpText={i18n.translate(
                'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.embedCaHelp',
                {
                  defaultMessage:
                    'Carries the CA certificate inside the token instead of its pin, so the agent does not fetch it from the manager when it enrolls. It makes the token larger.',
                },
              )}
              fullWidth
            >
              <EuiSwitch
                label={i18n.translate(
                  'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.embedCaSwitch',
                  {
                    defaultMessage: 'Carry the CA certificate in the token',
                  },
                )}
                checked={embedCa}
                onChange={event => setEmbedCa(event.target.checked)}
              />
            </EuiFormRow>
            <EuiSpacer size='m' />
            <EuiFormRow
              label={i18n.translate(
                'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.noCredentialLabel',
                {
                  defaultMessage: 'Without credential',
                },
              )}
              helpText={i18n.translate(
                'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.noCredentialHelp',
                {
                  defaultMessage:
                    'Mints a token carrying only the address and the pin. It can point an agent at the manager but cannot authenticate its enrollment.',
                },
              )}
              fullWidth
            >
              <EuiSwitch
                label={i18n.translate(
                  'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.noCredentialSwitch',
                  {
                    defaultMessage: 'Mint the token without a credential',
                  },
                )}
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
              onClick={() => guardAction(onClose)}
              flush='left'
            >
              {mintedToken
                ? i18n.translate(
                    'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.closeButton',
                    {
                      defaultMessage: 'Close',
                    },
                  )
                : i18n.translate(
                    'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.cancelButton',
                    {
                      defaultMessage: 'Cancel',
                    },
                  )}
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
                {i18n.translate(
                  'wazuh.enrollmentTokens.createEnrollmentTokenFlyout.createButton',
                  {
                    defaultMessage: 'Create',
                  },
                )}
              </EuiButton>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </>
  );
};

export const CreateEnrollmentTokenFlyout = ({
  onClose,
}: CreateEnrollmentTokenFlyoutProps) => {
  /* Held above the guarded flyout so every way out of it -- the header X, the
  footer button and the confirmation dialog -- reports whether a token was
  minted without the content having to hand it back up. */
  const [mintedToken, setMintedToken] = useState<MintedEnrollmentToken | null>(
    null,
  );
  const close = () => onClose(Boolean(mintedToken));

  return (
    <UnsavedChangesGuardedFlyout
      onClose={close}
      size='m'
      aria-labelledby='createEnrollmentTokenFlyoutTitle'
      maskProps={{ onClick: () => {} }}
      outsideClickCloses={true}
    >
      <CreateEnrollmentTokenFlyoutContent
        mintedToken={mintedToken}
        onMinted={setMintedToken}
        onClose={close}
      />
    </UnsavedChangesGuardedFlyout>
  );
};
