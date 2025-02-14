# **General Plugin Structure and Functionality**

A **plugin** in this context follows a **modular and organized structure**, dividing its functionalities into **thematic groups**. Each group contains specific applications, each with its own logic and components.

Here’s a step-by-step guide on how to **create a new plugin** with **groups and applications**, using snippets based on the provided structure.

---

## **1️⃣ Creating the Plugin Structure**

```
📂 **`plugins/my-security-plugin/`** _(Root directory of the plugin)_
│── 📂 `public/` _(Frontend-related code)_
│ │── 📂 `groups/` _(Contains the different security-related groups)_
│ │ │── 📂 `network-security/` _(New group: Network Security)_
│ │ │ │── 📂 `apps/` _(Contains the individual applications in this group)_
│ │ │ │ │── 📂 `firewall-monitoring/` _(First app: Firewall Monitoring)_
│ │ │ │ │ │── 📄 `application.tsx` _(App entry point and rendering logic)_
│ │ │ │ │ │── 📄 `firewall-monitoring-app.tsx` _(Main React component for the app)_
│ │ │ │ │ │── 📄 `constants.ts` _(App-specific constants, titles, and IDs)_
│ │ │ │ │── 📂 `network-anomaly-detection/` _(Second app: Network Anomaly Detection)_
│ │ │ │ │ │── 📄 `application.tsx`
│ │ │ │ │ │── 📄 `network-anomaly-detection-app.tsx`
│ │ │ │ │ │── 📄 `constants.ts`
│ │ │ │── 📄 `applications.ts` _(Registers all apps in this group)_
│ │ │ │── 📄 `constants.ts` _(Defines the group ID, title, and description)_
│ │ │ │── 📄 `index.ts` _(Registers the group and navigation details)_
│ │── 📄 `category.ts` _(Defines categories for grouping apps in UI)_
```

---

## **2️⃣ Creating a Group: `network-security`**

A **group** represents a **category** of related applications.

📌 **File:** `public/groups/network-security/constants.ts`

```ts
import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../common/constants';

export const NETWORK_SECURITY_ID = 'network_security';
export const NETWORK_SECURITY_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${NETWORK_SECURITY_ID}`,
  { defaultMessage: 'Network Security' },
);
export const NETWORK_SECURITY_DESCRIPTION = i18n.translate(
  `${PLUGIN_ID}.category.${NETWORK_SECURITY_ID}.description`,
  { defaultMessage: 'Monitor and secure your network infrastructure.' },
);
```

📌 **File:** `public/groups/network-security/index.ts`

```ts
import { Subject } from 'rxjs';
import {
  App,
  AppMountParameters,
  AppUpdater,
  ChromeNavGroup,
  ChromeRegistrationNavLink,
} from '../../../../../src/core/public';
import { CATEGORY } from '../category';
import { Group } from '../../../../wazuh-core/public/services/application/types';
import { getNetworkSecurityApps } from './applications';
import {
  NETWORK_SECURITY_DESCRIPTION,
  NETWORK_SECURITY_ID,
  NETWORK_SECURITY_TITLE,
} from './constants';

export const NetworkSecurityNavGroup: Group<typeof NETWORK_SECURITY_ID> = {
  getId: () => NETWORK_SECURITY_ID,
  getTitle: () => NETWORK_SECURITY_TITLE,
  getDescription: () => NETWORK_SECURITY_DESCRIPTION,

  getNavGroup(): ChromeNavGroup {
    return {
      id: NETWORK_SECURITY_ID,
      title: NETWORK_SECURITY_TITLE,
      description: NETWORK_SECURITY_DESCRIPTION,
    };
  },

  getAppGroup(): App {
    return {
      id: NETWORK_SECURITY_ID,
      title: NETWORK_SECURITY_TITLE,
      category: CATEGORY,
      mount: async (_params: AppMountParameters) => () => {},
    };
  },

  getGroupNavLink(): ChromeRegistrationNavLink {
    return {
      id: NETWORK_SECURITY_ID,
      title: NETWORK_SECURITY_TITLE,
      category: CATEGORY,
    };
  },

  getAppsNavLinks(): ChromeRegistrationNavLink[] {
    return getNetworkSecurityApps().map(app => ({
      id: app.id,
      title: app.title,
    }));
  },

  getApps(
    applicationService: ApplicationService,
    updater$: Subject<AppUpdater>,
  ): App[] {
    return getNetworkSecurityApps(applicationService, updater$);
  },
};
```

---

## **3️⃣ Creating an Application: `firewall-monitoring`**

📌 **File:** `public/groups/network-security/apps/firewall-monitoring/constants.ts`

```ts
import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../../../common/constants';
import { buildSubAppId } from '../../../../utils';
import { NETWORK_SECURITY_ID } from '../../constants';

export const FIREWALL_MONITORING_ID = buildSubAppId(
  NETWORK_SECURITY_ID,
  'firewall-monitoring',
);
export const FIREWALL_MONITORING_TITLE = i18n.translate(
  `${PLUGIN_ID}.category.${FIREWALL_MONITORING_ID}`,
  {
    defaultMessage: 'Firewall Monitoring',
  },
);
```

📌 **File:** `public/groups/network-security/apps/firewall-monitoring/firewall-monitoring-app.tsx`

```tsx
import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { FIREWALL_MONITORING_TITLE } from './constants';

interface FirewallMonitoringProps {
  params: AppMountParameters;
}

export const FirewallMonitoringApp = (_props: FirewallMonitoringProps) => (
  <>{FIREWALL_MONITORING_TITLE} App</>
);
```

📌 **File:** `public/groups/network-security/apps/firewall-monitoring/application.tsx`

```tsx
import React from 'react';
import { AppMountParameters } from 'opensearch-dashboards/public';
import ReactDOM from 'react-dom';
import { NetworkSecurityNavGroup } from '../..';
import { Layout } from '../../../layout';
import { createSideNavItems } from '../../../side-nav';
import { NETWORK_SECURITY_TITLE } from '../../constants';
import { FirewallMonitoringApp } from './firewall-monitoring-app';
import { FIREWALL_MONITORING_ID } from './constants';

export const renderApp = async (
  params: AppMountParameters,
  { Layout }: AppProps,
) => {
  ReactDOM.render(
    <Layout>
      <FirewallMonitoringApp params={params} />
    </Layout>,
    params.element,
  );

  return () => ReactDOM.unmountComponentAtNode(params.element);
};
```

---

## **4️⃣ Registering Applications in the Group**

📌 **File:** `public/groups/network-security/applications.ts`

```ts
import { Subject } from 'rxjs';
import {
  App,
  AppMountParameters,
  AppNavLinkStatus,
  AppUpdater,
} from '../../../../../src/core/public';
import { ApplicationService } from '../../../../wazuh-core/public/services/application/application';
import {
  FIREWALL_MONITORING_ID,
  FIREWALL_MONITORING_TITLE,
} from './apps/firewall-monitoring/constants';
import { NetworkSecurityNavGroup } from '.';

export function getNetworkSecurityApps(
  applicationService?: ApplicationService,
  updater$?: Subject<AppUpdater>,
): App[] {
  const networkSecurityLayout = applicationService?.createLayout(
    NetworkSecurityNavGroup,
  );

  return [
    {
      id: FIREWALL_MONITORING_ID,
      title: FIREWALL_MONITORING_TITLE,
      navLinkStatus: AppNavLinkStatus.hidden,
      updater$,
      mount: async (params: AppMountParameters) => {
        const { renderApp } = await import(
          './apps/firewall-monitoring/application'
        );

        return await renderApp(params, {
          Layout: networkSecurityLayout!(FIREWALL_MONITORING_ID),
        });
      },
    },
  ];
}
```

---

## **5️⃣ Updating `category.ts` to Include the New Group**

📌 **File:** `public/groups/category.ts`

```ts
import { AppCategory } from 'opensearch-dashboards/public';
import { PLUGIN_TITLE, PLUGIN_ID } from '../../common/constants';

export const CATEGORY: AppCategory = Object.freeze({
  id: PLUGIN_ID,
  label: PLUGIN_TITLE,
  order: 5000,
});
```
