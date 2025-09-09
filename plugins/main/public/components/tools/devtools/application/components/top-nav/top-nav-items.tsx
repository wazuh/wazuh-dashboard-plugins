import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiSmallButton } from '@elastic/eui';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { MenuItemPosition, TopNavMenuItem } from './top-nav-menu';

export const topNavItems = {
  exportItem: onClick => ({
    id: 'export',
    label: i18n.translate('serverDevTools.exportTabLabel', {
      defaultMessage: 'Export',
    }),
    description: i18n.translate('serverDevTools.exportTabDescription', {
      defaultMessage: 'Export',
    }),
    onClick: () => {
      onClick();
    },
    testId: 'consoleExportButton',
    render: commonProps => (
      <EuiSmallButton minWidth='unset' {...commonProps}>
        {i18n.translate('serverDevTools.exportTabLabel', {
          defaultMessage: 'Export',
        })}
      </EuiSmallButton>
    ),
    position: MenuItemPosition.RIGHT,
  }),
  apiReferenceItem: onClick => ({
    id: 'api-reference',
    label: i18n.translate('serverDevTools.apiReferenceTabLabel', {
      defaultMessage: 'API Reference',
    }),
    description: i18n.translate('serverDevTools.apiReferenceTabDescription', {
      defaultMessage: 'API Reference',
    }),
    onClick: () => {
      onClick();
    },
    testId: 'consoleApiReferenceButton',
    renderWrapper: ({ children, ['data-test-subj']: dataTestSubj }) => (
      <a
        style={{ color: 'inherit', textDecoration: 'none' }}
        data-test-subj={dataTestSubj}
        href={webDocumentationLink('user-manual/api/reference.html')}
        target='_blank'
        rel='noopener noreferrer'
      >
        {children}
      </a>
    ),
    render: commonProps => (
      <EuiSmallButton
        minWidth='unset'
        fill
        {...commonProps}
        href={webDocumentationLink('user-manual/api/reference.html')}
        target='_blank'
        rel='noopener noreferrer'
      >
        {i18n.translate('serverDevTools.apiReferenceTabLabel', {
          defaultMessage: 'API Reference',
        })}
      </EuiSmallButton>
    ),
    position: MenuItemPosition.LEFT,
  }),
} satisfies Record<`${string}Item`, (onClick: () => void) => TopNavMenuItem>;
