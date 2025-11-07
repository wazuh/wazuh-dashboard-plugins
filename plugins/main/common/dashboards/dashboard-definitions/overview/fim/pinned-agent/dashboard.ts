import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import {
  getVisStateAgentFIMActions,
  getVisStateAgentFIMEvents,
  getVisStateAgentFIMFilesAdded,
  getVisStateAgentFIMFilesDeleted,
  getVisStateAgentFIMFilesModified,
  getVisStateAgentFIMUsers
} from '../vis-states';

export class FimPinnedAgentDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 12,
          h: 10,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateAgentFIMUsers(indexPatternId),
      },
      {
        gridData: {
          w: 12,
          h: 10,
          x: 12,
          y: 0,
        },
        savedVis: getVisStateAgentFIMActions(indexPatternId),
      },
      {
        gridData: {
          w: 24,
          h: 10,
          x: 24,
          y: 0,
        },
        savedVis: getVisStateAgentFIMEvents(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 10,
          x: 0,
          y: 10,
        },
        savedVis: getVisStateAgentFIMFilesAdded(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 10,
          x: 16,
          y: 10,
        },
        savedVis: getVisStateAgentFIMFilesModified(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 10,
          x: 32,
          y: 10,
        },
        savedVis: getVisStateAgentFIMFilesDeleted(indexPatternId),
      },
    );
  }
}

export class FimPinnedAgentDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new FimPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'fim-pinned-agent-dashboard';
  }

  protected override getTitle(): string {
    return 'File Integrity Monitoring Agent Pinned Dashboard';
  }

  protected override getDescription(): string {
    return 'Pinned dashboard for File Integrity Monitoring (FIM) agent';
  }
}
