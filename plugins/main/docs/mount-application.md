## Mount application

The application mounts a ReactJS application into the HTML element provided by the parameters received on the `mount` method of the Wazuh dashboard application. The application could be wrapped in the root level with some contexts as `I18nProvider` and Redux provider to these are accessibles from any component in the tree:

```ts
// plugin.ts
{
  mount: async (params: AppMountParameters) => {
    try {
      // Load application bundle
      const { renderApp } = await import('./application');
      const unmount = await renderApp(params);
      return () => {
        unmount();
      };
    } catch (error) {
      console.debug(error);
    }
  },
}

```

```tsx
// application.ts
export async function renderApp(params) {
  /* Load or initiate the dependencies, async styles, etc... */

  const deps = {}; // dependencies
  ReactDOM.render(
    <I18nProvider>
      <Provider store={store}>
        <Application {...deps} />
      </Provider>
    </I18nProvider>,
    params.element,
  );
  return () => ReactDOM.unmountComponentAtNode(params.element);
}
```
