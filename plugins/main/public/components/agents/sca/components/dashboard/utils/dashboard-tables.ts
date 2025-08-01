import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import { getVisStateTable } from '../../../../../../services/visualizations';

export const getDashboardTables = (
  indexPatternId: string,
): {
  [panelId: string]: DashboardPanelState<
    EmbeddableInput & { [k: string]: unknown }
  >;
} => {
  return {
    t1: {
      gridData: {
        w: 12,
        h: 12,
        x: 0,
        y: 0,
        i: 't1',
      },
      type: 'visualization',
      explicitInput: {
        id: 't1',
        savedVis: getVisStateTable(
          indexPatternId,
          'agent.name',
          'Top 5 agents',
          'it-hygiene-stat',
          {
            fieldCustomLabel: 'Top 5 agents',
          },
        ),
      },
    },
    t2: {
      gridData: {
        w: 12,
        h: 12,
        x: 12,
        y: 0,
        i: 't2',
      },
      type: 'visualization',
      explicitInput: {
        id: 't2',
        savedVis: getVisStateTable(
          indexPatternId,
          'policy.name',
          'Top 5 policies',
          'sca-top-policies',
          {
            fieldCustomLabel: 'Top 5 policies',
          },
        ),
      },
    },
    t3: {
      gridData: {
        w: 12,
        h: 12,
        x: 24,
        y: 0,
        i: 't3',
      },
      type: 'visualization',
      explicitInput: {
        id: 't3',
        savedVis: getVisStateTable(
          indexPatternId,
          'check.name',
          'Top 5 checks',
          'sca-top-checks',
          {
            fieldCustomLabel: 'Top 5 checks',
          },
        ),
      },
    },
    t4: {
      gridData: {
        w: 12,
        h: 12,
        x: 36,
        y: 0,
        i: 't4',
      },
      type: 'visualization',
      explicitInput: {
        id: 't4',
        savedVis: getVisStateTable(
          indexPatternId,
          'check.compliance',
          'Top 5 compliance',
          'sca-top-compliance',
          {
            fieldCustomLabel: 'Top 5 compliance',
          },
        ),
      },
    },
  };
};
