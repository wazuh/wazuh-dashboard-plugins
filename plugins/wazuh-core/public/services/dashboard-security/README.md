# Dashboard security

The `dashboardSecurity` service is created in the core plugin and manage the security related to the Wazuh dashboard.

- Fetch data about the security platform (Wazuh dashboard security enabled or disabled)
- Store information about the current user account data
  - administrator
  - administrator requirements
- Expose hooks and HOCs for using with ReactJS

## Get account data

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
