# Dashboard security

The `dashboardSecurity` service is created in the core plugin and manage the security related to the Wazuh dashboard.

- Fetch data about the security platform (Wazuh dashboard security enabled or disabled)
- Store information about the current user account data
  - administrator
  - administrator requirements
- Expose hooks and HOCs for using with ReactJS

## Account data

```ts
export interface DashboardSecurityServiceAccount {
  administrator: boolean; // user is considered as administrator of Wazuh dashboard. This can be used for some Wazuh plugin features with no dependency of Wazuh indexer permissions
  administrator_requirements: string | null; // display a message about the requirements to be administrator if the user has not an administrator
}
```

## Get account data

See the [account data](#account-data).

### Using the service

```ts
plugins.wazuhCore.dashboardSecurity.account;
```

### In ReactJS components

- hook

```ts
const MyComponent = props => {
  const [dashboardSecurityAccount, setDashboardSecurityAccount] =
    getWazuhCorePlugin().hooks.useDashboardSecurityAccount();
};
```

- HOC

```ts
const MyComponent = getWazuhCorePlugin().hocs.withDashboardSecurityAccount(
  ({ dashboardSecurityAccount }) => {
    // dashboardSecurityAccount contains the dashboard account data
  },
);
```

## Get if the user is an administrator

Get if the user is considered as an administrator for Wazuh plugins.

> NOTE: this consideration is not related to Wazuh indexer permissions.

### Using the service

```ts
plugins.wazuhCore.dashboardSecurity.account.administrator;
```

### In ReactJS components

- hook

```ts
const MyComponent = props => {
  const dashboardSecurityAccountAdmin =
    getWazuhCorePlugin().hooks.useDashboardSecurityAccountAdmin();
};
```

- HOC

```ts
const MyComponent = getWazuhCorePlugin().hocs.withDashboardSecurityAccountAdmin(
  ({ dashboardSecurityAccountAdmin }) => {
    // dashboardSecurityAccountAdmin contains if the user is admin or not
  },
);
```
