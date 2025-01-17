import { i18n } from '@osd/i18n';
import { AppCategory, AppMountParameters } from 'opensearch-dashboards/public';
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
  private readonly translationMessages = {
    ANALYSIS_PLUGIN_TITLE: i18n.translate('analysis.title', {
      defaultMessage: 'Analysis',
    }),
    ENDPOINT_SECURITY: i18n.translate('analysis.endpoint_security', {
      defaultMessage: 'Endpoint Security',
    }),
    THREAT_INTELLIGENCE: i18n.translate('analysis.threat_intelligence', {
      defaultMessage: 'Threat Intelligence',
    }),
    SECURITY_OPERATIONS: i18n.translate('analysis.security_operations', {
      defaultMessage: 'Security Operations',
    }),
    CLOUD_SECURITY: i18n.translate('analysis.cloud_security', {
      defaultMessage: 'Cloud Security',
    }),
  };
  private readonly CATEGORY: AppCategory = {
    id: 'analysis',
    label: this.translationMessages.ANALYSIS_PLUGIN_TITLE,
    order: 5000,
  };

  public setup(
    core: CoreSetup,
    _plugins: AnalysisSetupDependencies,
  ): AnalysisSetup | Promise<AnalysisSetup> {
    console.debug('AnalysisPlugin started');

    const ApplicationsMap: Record<string, Omit<App, 'id'>> = {
      endpoint_security: {
        title: this.translationMessages.ENDPOINT_SECURITY,
        category: this.CATEGORY,
        async mount(params: AppMountParameters) {
          // TODO: Implement the endpoint security application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
      threat_intelligence: {
        title: this.translationMessages.THREAT_INTELLIGENCE,
        category: this.CATEGORY,
        async mount(params: AppMountParameters) {
          // TODO: Implement the threat intelligence application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
      security_operations: {
        title: this.translationMessages.SECURITY_OPERATIONS,
        category: this.CATEGORY,
        async mount(params: AppMountParameters) {
          // TODO: Implement the security operations application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
      cloud_security: {
        title: this.translationMessages.CLOUD_SECURITY,
        category: this.CATEGORY,
        async mount(params: AppMountParameters) {
          // TODO: Implement the cloud security application
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
