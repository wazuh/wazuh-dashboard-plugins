import { i18n } from '@osd/i18n';
import {
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiSmallButtonIcon,
  EuiToolTip,
} from '@elastic/eui';
import { MenuItemPosition, TopNavMenuItem } from './top-nav-menu';

export const topNavItems = {
  helpItem: onClick => ({
    id: 'help',
    label: i18n.translate('console.topNav.helpTabLabel', {
      defaultMessage: 'Help',
    }),
    description: i18n.translate('console.topNav.helpTabDescription', {
      defaultMessage: 'Help',
    }),
    onClick: () => {
      onClick();
    },
    testId: 'consoleHelpButton',
    render: commonProps => (
      <EuiToolTip
        content={i18n.translate('console.topNav.helpTabLabel', {
          defaultMessage: 'Help',
        })}
      >
        <EuiSmallButtonIcon
          iconType='questionInCircle'
          display='base'
          {...commonProps}
        />
      </EuiToolTip>
    ),
    position: MenuItemPosition.RIGHT,
  }),
  settingsItem: onClick => ({
    id: 'settings',
    label: i18n.translate('console.topNav.settingsTabLabel', {
      defaultMessage: 'Settings',
    }),
    description: i18n.translate('console.topNav.settingsTabDescription', {
      defaultMessage: 'Settings',
    }),
    onClick: () => {
      onClick();
    },
    testId: 'consoleSettingsButton',
    render: (commonProps: any) => (
      <EuiToolTip
        content={i18n.translate('console.topNav.settingsToolTipContent', {
          defaultMessage: 'Console settings',
        })}
      >
        <EuiSmallButtonIcon iconType='gear' display='base' {...commonProps} />
      </EuiToolTip>
    ),
    position: MenuItemPosition.RIGHT,
  }),
  historyItem: onClick => ({
    id: 'history',
    label: i18n.translate('console.topNav.historyTabLabel', {
      defaultMessage: 'History',
    }),
    description: i18n.translate('console.topNav.historyTabDescription', {
      defaultMessage: 'History',
    }),
    onClick: () => {
      onClick();
    },
    testId: 'consoleHistoryButton',
    render: (commonProps: any) => (
      <EuiSmallButtonEmpty
        {...commonProps}
        flush='both'
        iconType='arrowDown'
        iconSide='right'
      >
        {i18n.translate('console.topNav.historyTabLabel', {
          defaultMessage: 'History',
        })}
      </EuiSmallButtonEmpty>
    ),
    position: MenuItemPosition.LEFT,
  }),
  exportItem: onClick => ({
    id: 'export',
    label: i18n.translate('console.topNav.exportTabLabel', {
      defaultMessage: 'Export',
    }),
    description: i18n.translate('console.topNav.exportTabDescription', {
      defaultMessage: 'Export',
    }),
    onClick: () => {
      onClick();
    },
    testId: 'consoleExportButton',
    render: commonProps => (
      <EuiSmallButton minWidth='unset' {...commonProps}>
        {i18n.translate('console.topNav.exportTabLabel', {
          defaultMessage: 'Export',
        })}
      </EuiSmallButton>
    ),
    position: MenuItemPosition.RIGHT,
  }),
  importItem: onClick => ({
    id: 'import',
    label: i18n.translate('console.topNav.importTabLabel', {
      defaultMessage: 'Import',
    }),
    description: i18n.translate('console.topNav.importTabDescription', {
      defaultMessage: 'Import',
    }),
    onClick: () => {
      onClick();
    },
    testId: 'consoleImportButton',
    render: commonProps => (
      <EuiSmallButton minWidth='unset' fill {...commonProps}>
        {i18n.translate('console.topNav.importButtonLabel', {
          defaultMessage: 'Import query',
        })}
      </EuiSmallButton>
    ),
    position: MenuItemPosition.RIGHT,
  }),
  apiReferenceItem: onClick => ({
    id: 'api-reference',
    label: i18n.translate('console.topNav.apiReferenceTabLabel', {
      defaultMessage: 'API Reference',
    }),
    description: i18n.translate('console.topNav.apiReferenceTabDescription', {
      defaultMessage: 'API Reference',
    }),
    onClick: () => {
      onClick();
    },
    testId: 'consoleApiReferenceButton',
    render: commonProps => (
      <EuiSmallButton minWidth='unset' fill {...commonProps}>
        {i18n.translate('console.topNav.apiReferenceTabLabel', {
          defaultMessage: 'API Reference',
        })}
      </EuiSmallButton>
    ),
    position: MenuItemPosition.LEFT,
  }),
} satisfies Record<`${string}Item`, (onClick: () => void) => TopNavMenuItem>;
