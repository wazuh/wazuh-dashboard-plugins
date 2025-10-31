# Dashboard Renderer (by saved object id)

The new dashboard renderer is responsible for rendering dashboards saved as saved objects. By providing the saved object ID, the renderer takes care of obtaining the panels and rendering them.
Additionally, to connect with the search bar and filters, additional parameters are sent to it.

Through the dashboardId, agentDashboardId, and hasPinnedAgent properties, you can add the functionality to switch dashboards depending on whether it's showing data for a single agent or for all agents.

### Example of usage

```typescript
import { DashboardRenderer } from './dashboard-renderer';



export function DashboardContainer ({
  dashboardId,
  agentDashboardId,
  className,
  hasPinnedAgent,
  config,
}) {

  const pinnedAgentFilter = Boolean(config?.dataSource?.dataSource?.getPinnedAgentFilter()?.length);

  return (
    <DashboardRenderer
      dashboardId={dashboardId}
      agentDashboardId={agentDashboardId}
      className={className}
      hasPinnedAgent={pinnedAgentFilter}
      config={{
        dataSource: config?.dataSource,
      }}
    />
  );
}
```

It's important to verify that the dashboard and agentDashboardId IDs are valid. If they are not provided, the renderer will display an error message. To verify this, you can go to `Explore > Dashboards` or `Dashboards Management > Saved Objects`.

This way, the new component is fully connected to the dashboard saved object, which means that to edit it, you must go to `Dashboards Management > Saved Objects` and edit the corresponding dashboard. This removes all hardcoding of panels in the component and facilitates real-time editing.

In case of error, whether in obtaining the dashboard specification or misuse of the component, different error messages will be displayed in the UI to facilitate debugging.
