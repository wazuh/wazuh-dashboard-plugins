import { getVisStateMetric, SCA_CHECK_RESULT } from '../../../../lib';
import {
  DashboardConfig,
  DashboardLayoutDefinition,
} from '../../../../lib/dashboard-config-service';
import { getCheckResultColors } from '../../../../lib/helpers';
import type { SavedVis } from "../../../../types";
import { getVisStateCheckScore } from './vis-states';

export class SCAKPIsDashboardLayoutDefinition extends DashboardLayoutDefinition {
  constructor(indexPatternId: string) {
    super();

    const panels = Object.values({
      '1': {
        gridData: { w: 12, h: 6, x: 0, y: 0, i: '1' },
        type: 'visualization',
        explicitInput: {
          id: '1',
          savedVis: getVisStateMetric(indexPatternId, {
            id: 'check_result_passed',
            title: 'Checks passed',
            colors: getCheckResultColors(),
            colorSchema: 'Greens',
            useRanges: true,
            aggsQuery: [
              {
                input: {
                  query: `check.result: "${SCA_CHECK_RESULT.PASSED}"`,
                  language: 'kuery',
                },
                label: SCA_CHECK_RESULT.PASSED,
              },
            ],
          }),
        },
      },
      '2': {
        gridData: {
          w: 12,
          h: 6,
          x: 12,
          y: 0,
          i: '2',
        },
        type: 'visualization',
        explicitInput: {
          id: '2',
          savedVis: getVisStateMetric(indexPatternId, {
            id: 'check_result_failed',
            title: 'Checks failed',
            colors: getCheckResultColors(),
            colorSchema: 'Reds',
            aggsQuery: [
              {
                input: {
                  query: `check.result: "${SCA_CHECK_RESULT.FAILED}"`,
                  language: 'kuery',
                },
                label: SCA_CHECK_RESULT.FAILED,
              },
            ],
          }),
        },
      },
      '3': {
        gridData: {
          w: 12,
          h: 6,
          x: 24,
          y: 0,
          i: '3',
        },
        type: 'visualization',
        explicitInput: {
          id: '3',
          savedVis: getVisStateMetric(indexPatternId, {
            id: 'check_result_not_run',
            title: 'Checks not run',
            colors: getCheckResultColors(),
            colorSchema: 'Blues',
            aggsQuery: [
              {
                input: {
                  query: `check.result: "${SCA_CHECK_RESULT.NOT_RUN}"`,
                  language: 'kuery',
                },
                label: SCA_CHECK_RESULT.NOT_RUN,
              },
            ],
          }),
        },
      },
      '4': {
        gridData: {
          w: 12,
          h: 6,
          x: 36,
          y: 0,
          i: '4',
        },
        type: 'visualization',
        explicitInput: {
          id: '4',
          savedVis: getVisStateCheckScore(indexPatternId),
        },
      },
    }).map(panel => ({
      gridData: panel.gridData,
      savedVis: panel.explicitInput.savedVis,
    }));

    this.setGridVisualizationPairs(...panels);
  }
}

export class SCAKPIsDashboardConfig extends DashboardConfig {
  constructor(indexPatternId: string) {
    super(indexPatternId, new SCAKPIsDashboardLayoutDefinition(indexPatternId));
  }

  protected override getId(): string {
    return 'sca-kpis-dashboard';
  }

  protected override getTitle(): string {
    return 'Software Composition Analysis KPIs';
  }

  protected override getDescription(): string {
    return 'Dashboard for Software Composition Analysis (SCA) KPIs';
  }
}

export class SCAKPIsDashboardPanelsService {
  public static getDashboardPanels(indexPatternId: string) {
    return new SCAKPIsDashboardConfig(indexPatternId).getDashboardPanels();
  }
}