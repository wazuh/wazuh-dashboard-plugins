import { DashboardPanelState } from '../../../../../../../../src/plugins/dashboard/public/application';
import { EmbeddableInput } from '../../../../../../../../src/plugins/embeddable/public';
import { getVisStateTable } from '../../../../../common/dashboards/lib';

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
          'package.name',
          'Top 5 installed packages',
          'it-hygiene-top-packages',
          {
            fieldCustomLabel: 'Top 5 installed packages',
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
          'process.name',
          'Top 5 running processes',
          'it-hygiene-top-processes',
          {
            fieldCustomLabel: 'Top 5 running processes',
            filters: [
              {
                $state: {
                  store: 'appState',
                },
                exists: {
                  field: 'source.port',
                },
                meta: {
                  alias: null,
                  disabled: false,
                  key: 'source.port',
                  negate: true,
                  type: 'exists',
                  value: 'exists',
                  index: indexPatternId,
                },
              },
            ],
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
          'host.os.name',
          'Top 5 operating systems',
          'it-hygiene-top-operating-system-names',
          {
            fieldCustomLabel: 'Top 5 operating systems',
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
          'host.cpu.name',
          'Top 5 CPUs',
          'it-hygiene-stat',
          {
            fieldCustomLabel: 'Top 5 host CPUs',
          },
        ),
      },
    },
  };
};
