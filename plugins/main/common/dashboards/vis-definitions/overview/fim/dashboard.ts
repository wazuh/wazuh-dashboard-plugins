import {
  DashboardByRendererConfig,
  DashboardLayoutDefinition,
} from '../../../lib/dashboard-builder';
import {
  getVisStateAgentFIMActions,
  getVisStateAgentFIMEvents,
  getVisStateAgentFIMFilesAdded,
  getVisStateAgentFIMFilesDeleted,
  getVisStateAgentFIMFilesModified,
  getVisStateAgentFIMUsers,
  getVisStateFIMAlertsByActionOverTime,
  getVisStateFIMCommonActions,
  getVisStateFIMEventsSummary,
  getVisStateFIMTopAgentsPie,
  getVisStateFIMTopAgentsUser,
  getVisStateFIMTopRules,
} from './vis-states';

export abstract class FimDashboardLayoutDefinition extends DashboardLayoutDefinition {}

export class FimOverviewDashboardLayoutDefinition extends FimDashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();
    this.setGridVisualizationPairs(
      {
        gridData: {
          w: 48,
          h: 10,
          x: 0,
          y: 0,
        },
        savedVis: getVisStateFIMAlertsByActionOverTime(indexPatternId),
      },
      {
        gridData: {
          w: 14,
          h: 10,
          x: 0,
          y: 10,
        },
        savedVis: getVisStateFIMTopAgentsPie(indexPatternId),
      },
      {
        gridData: {
          w: 34,
          h: 10,
          x: 14,
          y: 10,
        },
        savedVis: getVisStateFIMEventsSummary(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 10,
          x: 0,
          y: 20,
        },
        savedVis: getVisStateFIMTopRules(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 10,
          x: 16,
          y: 20,
        },
        savedVis: getVisStateFIMCommonActions(indexPatternId),
      },
      {
        gridData: {
          w: 16,
          h: 10,
          x: 32,
          y: 20,
        },
        savedVis: getVisStateFIMTopAgentsUser(indexPatternId),
      },
    );
  }
}

export class FimPinnedAgentDashboardLayoutDefinition extends FimDashboardLayoutDefinition {
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

export abstract class FimDashboardByRendererConfig extends DashboardByRendererConfig {}

export class FimOverviewDashboardByRendererConfig extends FimDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(indexPatternId, new FimOverviewDashboardLayoutDefinition(indexPatternId));
  }

  protected override getId(): string {
    return 'fim-overview-dashboard';
  }

  protected override getTitle(): string {
    return 'File Integrity Monitoring Overview';
  }

  protected override getDescription(): string {
    return 'Overview dashboard for File Integrity Monitoring (FIM)';
  }
}

export class FimPinnedAgentDashboardByRendererConfig extends FimDashboardByRendererConfig {
  constructor(indexPatternId: string) {
    super(
      indexPatternId,
      new FimPinnedAgentDashboardLayoutDefinition(indexPatternId),
    );
  }

  protected override getId(): string {
    return 'fim-agent-pinned-dashboard';
  }

  protected override getTitle(): string {
    return 'File Integrity Monitoring Agent Pinned Dashboard';
  }

  protected override getDescription(): string {
    return 'Pinned dashboard for File Integrity Monitoring (FIM) agent';
  }
}
