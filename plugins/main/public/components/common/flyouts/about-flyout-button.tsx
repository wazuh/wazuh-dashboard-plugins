/*
 * Wazuh app - About flyout button shared by the module pages
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState } from 'react';
import {
  EuiButtonEmpty,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { webDocumentationLink } from '../../../../common/services/web_documentation';

/**
 * Link to a page of the Wazuh documentation that opens in a new tab.
 */
export const AboutFlyoutDocsLink = ({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) => (
  <EuiLink
    href={webDocumentationLink(path)}
    target='_blank'
    rel='noopener noreferrer'
    external
  >
    {children}
  </EuiLink>
);

interface AboutFlyoutButtonProps {
  /** Label of the button and title of the flyout. */
  title: string;
  /** Suffix of the test ids: wzAbout<testSubj>Button and wzAbout<testSubj>Flyout. */
  testSubj: string;
  /** Path of the module page in the Wazuh documentation. */
  docsPath: string;
  /** Content of the flyout body. */
  children: React.ReactNode;
}

/**
 * Button that opens a flyout explaining a module, with a link to its
 * documentation under the title.
 */
export const AboutFlyoutButton = ({
  title,
  testSubj,
  docsPath,
  children,
}: AboutFlyoutButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = `wzAbout${testSubj}Title`;

  return (
    <>
      <EuiButtonEmpty
        iconType='iInCircle'
        onClick={() => setIsOpen(true)}
        data-test-subj={`wzAbout${testSubj}Button`}
      >
        {title}
      </EuiButtonEmpty>
      {isOpen && (
        <EuiFlyout
          onClose={() => setIsOpen(false)}
          size='m'
          ownFocus
          aria-labelledby={titleId}
          data-test-subj={`wzAbout${testSubj}Flyout`}
        >
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size='s'>
              <h2 id={titleId}>{title}</h2>
            </EuiTitle>
            <EuiSpacer size='xs' />
            <EuiText size='s'>
              <p>
                <FormattedMessage
                  id='wazuh.common.aboutFlyout.learnMore'
                  defaultMessage='Learn more in the {link}.'
                  values={{
                    link: (
                      <AboutFlyoutDocsLink path={docsPath}>
                        {i18n.translate(
                          'wazuh.common.aboutFlyout.learnMoreLink',
                          { defaultMessage: 'documentation' },
                        )}
                      </AboutFlyoutDocsLink>
                    ),
                  }}
                />
              </p>
            </EuiText>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>{children}</EuiFlyoutBody>
        </EuiFlyout>
      )}
    </>
  );
};
