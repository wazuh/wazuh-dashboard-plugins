import React from 'react';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { IntegrationOverview } from '../integretions/overview';
import { IntegrationView } from '../integretions/integration-details';
import { getCore } from '../../plugin-services';
import { OverviewTemplate } from './templates/overview-template';
import { DetailsTemplate } from './templates/details-template';
import { CreateTemplate } from './templates/create-template';

interface ViewInterface {
  name: string;
  id: string;
  path: string;
  renderOnMenu: boolean;
  renderMenu: boolean;
  render: () => React.ReactNode;
  breadcrumb: (
    name?: string,
  ) => { text: string | React.ReactNode; className?: string }[];
}

export const views: ViewInterface[] = [
  {
    name: i18n.translate('wz-security-policies-integrations', {
      defaultMessage: 'Integrations',
    }),
    id: 'integrations',
    path: '/integrations',
    renderOnMenu: true,
    renderMenu: true,
    render: () => <IntegrationOverview />,
    breadcrumb: () => [
      {
        className: 'osdBreadcrumbs',
        text: (
          <FormattedMessage
            id={`wz-security-policies-breadcrumbs-Integrations`}
            defaultMessage='Integrations'
          />
        ),
      },
    ],
  },
  {
    name: i18n.translate('wz-security-policies-integration-details', {
      defaultMessage: 'Integrations details',
    }),
    id: 'integrationsDetails',
    path: '/integrations/:id',
    renderOnMenu: false,
    renderMenu: true,
    render: () => <IntegrationView />,
    breadcrumb: (name?: string) => [
      {
        text: (
          <FormattedMessage
            id={`wz-security-policies-breadcrumbs-integrationsDetails`}
            defaultMessage={
              views.find(view => view.id === 'integrations')?.name
            }
          />
        ),
        href: getCore().application.getUrlForApp('wazuhSecurityPolicies', {
          path: `#/${views.find(view => view.id === 'integrations')?.path}`,
        }),
      },
      {
        className: 'osdBreadcrumbs',
        text: decodeURIComponent(name || ''),
      },
    ],
  },
  {
    name: i18n.translate('wz-security-policies-rules', {
      defaultMessage: 'Rules',
    }),
    id: 'rules',
    path: '/rules',
    renderOnMenu: true,
    renderMenu: true,
    render: () => <OverviewTemplate />,
    breadcrumb: () => [
      {
        className: 'osdBreadcrumbs',
        text: (
          <FormattedMessage
            id={`wz-security-policies-breadcrumbs-rules`}
            defaultMessage='Rules'
          />
        ),
      },
    ],
  },
  {
    name: i18n.translate('wz-security-policies-rules-create', {
      defaultMessage: 'Rules create',
    }),
    id: 'rulesCreate',
    path: '/rules/create',
    renderOnMenu: false,
    renderMenu: false,
    render: () => <CreateTemplate />,
    breadcrumb: () => [
      {
        className: 'osdBreadcrumbs',
        text: (
          <FormattedMessage
            id={`wz-security-policies-breadcrumbs-rules`}
            defaultMessage='Rules'
          />
        ),
        href: getCore().application.getUrlForApp('wazuhSecurityPolicies', {
          path: `#/${views.find(view => view.id === 'rules')?.path}`,
        }),
      },
      {
        text: (
          <FormattedMessage
            id={`wz-security-policies-breadcrumbs-rulesCreate`}
            defaultMessage='Create'
          />
        ),
      },
    ],
  },
  {
    name: i18n.translate('wz-security-policies-rule-details', {
      defaultMessage: 'Rule details',
    }),
    id: 'rulesDetails',
    path: '/rules/:id',
    renderOnMenu: false,
    renderMenu: false,
    render: () => <DetailsTemplate />,
    breadcrumb: (name?: string) => [
      {
        text: (
          <FormattedMessage
            id={`wz-security-policies-breadcrumbs-rulesDetails`}
            defaultMessage={views.find(view => view.id === 'rules')?.name}
          />
        ),
        href: getCore().application.getUrlForApp('wazuhSecurityPolicies', {
          path: `#/${views.find(view => view.id === 'rules')?.path}`,
        }),
      },
      {
        className: 'osdBreadcrumbs',
        text: decodeURIComponent(name || ''),
      },
    ],
  },
  {
    name: i18n.translate('wz-security-policies-decoders', {
      defaultMessage: 'Decoders',
    }),
    id: 'decoders',
    path: '/decoders',
    renderOnMenu: true,
    renderMenu: true,
    render: () => <OverviewTemplate />,
    breadcrumb: () => [
      {
        className: 'osdBreadcrumbs',
        text: (
          <FormattedMessage
            id={`wz-security-policies-decoders`}
            defaultMessage='Decoders'
          />
        ),
      },
    ],
  },
  {
    name: i18n.translate('wz-security-policies-decoders-details', {
      defaultMessage: 'Decoders details',
    }),
    id: 'decodersDetails',
    path: '/decoders/:id',
    renderOnMenu: false,
    renderMenu: false,
    render: () => <DetailsTemplate />,
    breadcrumb: (name?: string) => [
      {
        text: (
          <FormattedMessage
            id={`wz-security-policies-breadcrumbs-decodersDetails`}
            defaultMessage={views.find(view => view.id === 'decoders')?.name}
          />
        ),
        href: getCore().application.getUrlForApp('wazuhSecurityPolicies', {
          path: `#/${views.find(view => view.id === 'decoders')?.path}`,
        }),
      },
      {
        className: 'osdBreadcrumbs',
        text: decodeURIComponent(name || ''),
      },
    ],
  },
  {
    name: i18n.translate('wz-security-policies-kvdb', {
      defaultMessage: 'KVDB',
    }),
    id: 'kvdb',
    path: '/kvdb',
    renderOnMenu: true,
    renderMenu: true,
    render: () => <OverviewTemplate />,
    breadcrumb: () => [
      {
        className: 'osdBreadcrumbs',
        text: (
          <FormattedMessage
            id={`wz-security-policies-breadcrumbs-kvdb`}
            defaultMessage='KVDB'
          />
        ),
      },
    ],
  },
  {
    name: i18n.translate('wz-security-policies-kvdb-details', {
      defaultMessage: 'KVDB details',
    }),
    id: 'kvdbDetails',
    path: '/kvdb/:id',
    renderOnMenu: false,
    renderMenu: false,
    render: () => <DetailsTemplate />,
    breadcrumb: (name?: string) => [
      {
        text: (
          <FormattedMessage
            id={`wz-security-policies-breadcrumbs-kvdbDetails`}
            defaultMessage={views.find(view => view.id === 'kvdb')?.name}
          />
        ),
        href: getCore().application.getUrlForApp('wazuhSecurityPolicies', {
          path: `#/${views.find(view => view.id === 'kvdb')?.path}`,
        }),
      },
      {
        className: 'osdBreadcrumbs',
        text: decodeURIComponent(name || ''),
      },
    ],
  },
];
