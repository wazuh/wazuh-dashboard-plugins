import { i18n } from '@osd/i18n';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { App, CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { AnalysisSetup, AnalysisStart } from './types';

interface AnalysisSetupDependencies {}

interface AnalysisStartDependencies {
  navigation: NavigationPublicPluginStart;
}

export class AnalysisPlugin
  implements
    Plugin<AnalysisSetup, AnalysisStart, object, AnalysisStartDependencies>
{
  private readonly title = i18n.translate('analysis.title', {
    defaultMessage: 'Analysis',
  });

  public setup(
    core: CoreSetup,
    _plugins: AnalysisSetupDependencies,
  ): AnalysisSetup | Promise<AnalysisSetup> {
    console.debug('AnalysisPlugin started');

    const ApplicationsMap: Record<string, Omit<App, 'id'>> = {
      analysis: {
        title: this.title,
        async mount(params: AppMountParameters) {
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
    };
    const APPLICATIONS = Object.entries(ApplicationsMap).map(([id, app]) => ({
      ...app,
      id,
    }));

    for (const app of APPLICATIONS) {
      core.application.register(app);
    }

    return {};
  }

  start(
    _core: CoreStart,
    _plugins: AnalysisStartDependencies,
  ): AnalysisStart | Promise<AnalysisStart> {
    return {};
  }

  stop?(): void {}
}
