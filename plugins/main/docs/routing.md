## Navigation

Due we need to do some redirections to routes that are defined in services that are decoupled of the navigation, we need to use some service that has the context of the navigation. This is done though the `NavigationService`.

The `NavigationService` is responsible to manage the navigation of the same application and navigate to others applications and is created with a reference to a new history we create before mount the application. This services is using for navigating instead of using the interfaces provided by the `react-router-dom`

```ts
NavigationService.getInstance(history);
```

## Routing

The `Application` component defines the layout of the application under the router provided by `react-router-dom`.

The routing of the application is based on path names and search parameters. This architecture is inherited from the old routing based on AngularJS that was using the application.

```tsx
// app-router
import { Router, Switch, Route } from 'react-router-dom';

const Application =  () => {
  // general states or effects

  return (
    <Router history={history}>
     {/* General components that could be always displayed in all views or conditionally */}
     <Switch>
      <Route path={'/health-check'} exact render={HealthCheck}></Route>
      {/* Rest of routes */}
     <Switch>
    <Router>
  )
}
```

### Routing based on search parameters

Some views are managed depending on the search parameters ( `tab=syscollector` ), and the current version of `react-router-dom` that is `v5` is unable to re-render components when the search parameters change. To cover this requirement, we use a custom routing components/hooks/HOCs that have a similar interface to the provided by the `react-router-dom`.

- Components with similar interface that provided by `react-router-dom`
  - Switch: find the first Route that matches the search paramerts or render the Redirect if this is included
  - Route: define the route match parameters to render the component
  - Redirect: redirect to another "route" based on search parameters

```tsx
import { Switch, Route, Redict } from '../router-search';

const Security = () => {
  return (
    <Switch>
      <Route path='?tab=users'>
        <Users></Users>
      </Route>
      <Route path='?tab=roles'>
        <Roles></Roles>
      </Route>
      <Route path='?tab=policies'>
        <Policies></Policies>
      </Route>
      <Route path='?tab=roleMapping'>
        <>
          {allowRunAs !== undefined &&
            allowRunAs !==
              getWazuhCorePlugin().API_USER_STATUS_RUN_AS.ENABLED &&
            isNotRunAs(allowRunAs)}
          <RolesMapping></RolesMapping>
        </>
      </Route>
      <Redirect to='?tab=users'></Redirect>
    </Switch>
  );
};
```

The `path` property of the `Route` component allows to define a variable value for a search parameter, using the `:` at the beggining of the search parameter definition using the syntax: `?<parameter_name>=:value`. The `:value` defines the value for `<parameter_name>` search parameter is variable. The name of the `value` is unused. To access to the value of the `<parameter_name>` search parameter, use the `render` property of the `Route` component.Example:

```tsx
class RegistryTable extends Coomponent {
  render() {
    return (
      <div>
        {registryTable}
        <Switch>
          <Route
            path='?file=:file'
            render={({ search: { file } }) => (
              <FlyoutDetail
                fileName={file}
                agentId={this.props.agent.id}
                closeFlyout={() => this.closeFlyout()}
                view='inventory'
                {...this.props}
              />
            )}
          ></Route>
        </Switch>
      </div>
    );
  }
}
```

- hooks:
  - useRouterSearch: returns the search parameters

```tsx
import { useRouterSearch } from '../use-router-search';
export const Component = () => {
  // Get the tab search parameter
  const { tab } = useRouterSearch();
  return <></>;
};
```

```tsx
import { useRouterSearch } from '../use-router-search';
export const Component = () => {
  // Get the tab search parameter and use a value as default if this is undefined
  const { tab = 'welcome' } = useRouterSearch();
  return <></>;
};
```

- HOCs:
  - withRouterSearch: inject the search parameters through the `search` property

```tsx
import { withRouterSearch } from '../with-router-search';
export const Component = withRouterSearch(({ search }) => {
  // search property has the searh parameters

  if (search.tab === 'value') {
    // any logic
  }
  return <></>;
});
```
