export default () => ({
  id: 'wazuh-metrics',
  title: 'Metrics',
  chromeless: false,
  mount: async ({ core, params }) => {
    // @ts-ignore depsStart not used.
    const { renderApp } = await import('./app-main');
    const [coreStart, depsStart] = await core.getStartServices();
    return renderApp(coreStart, params);
  }
});
