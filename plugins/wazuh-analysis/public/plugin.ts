import { i18n } from '@osd/i18n';
import { AppCategory, AppMountParameters } from 'opensearch-dashboards/public';
import {
  App,
  CoreSetup,
  CoreStart,
  Plugin,
  DEFAULT_NAV_GROUPS,
} from '../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { OmitStrict } from '../../wazuh-core/common/types';
import { AnalysisSetup, AnalysisStart } from './types';

interface AnalysisSetupDependencies {}

interface AnalysisStartDependencies {
  navigation: NavigationPublicPluginStart;
}

export class AnalysisPlugin
  implements
    Plugin<AnalysisSetup, AnalysisStart, object, AnalysisStartDependencies>
{
  private readonly PLUGIN_ID = 'analysis';
  private readonly ENDPOINT_SECURITY_ID = 'endpoint_security';
  private readonly THREAT_INTELLIGENCE_ID = 'threat_intelligence';
  private readonly SECURITY_OPERATIONS_ID = 'security_operations';
  private readonly CLOUD_SECURITY_ID = 'cloud_security';
  private readonly CONFIGURATION_ASSESSMENT_ID = 'configuration_assessment';
  private readonly MALWARE_DETECTION_ID = 'malware_detection';
  private readonly FIM_ID = 'fim';
  private readonly translationMessages = {
    ANALYSIS_PLUGIN_TITLE: i18n.translate('analysis.title', {
      defaultMessage: 'Analysis',
    }),
    ENDPOINT_SECURITY_TITLE: i18n.translate(
      `${this.PLUGIN_ID}.category.${this.ENDPOINT_SECURITY_ID}`,
      {
        defaultMessage: 'Endpoint Security',
      },
    ),
    THREAT_INTELLIGENCE_TITLE: i18n.translate(
      `${this.PLUGIN_ID}.category.${this.THREAT_INTELLIGENCE_ID}`,
      {
        defaultMessage: 'Threat Intelligence',
      },
    ),
    SECURITY_OPERATIONS_TITLE: i18n.translate(
      `${this.PLUGIN_ID}.category.${this.SECURITY_OPERATIONS_ID}`,
      {
        defaultMessage: 'Security Operations',
      },
    ),
    CLOUD_SECURITY_TITLE: i18n.translate(
      `${this.PLUGIN_ID}.category.${this.CLOUD_SECURITY_ID}`,
      {
        defaultMessage: 'Cloud Security',
      },
    ),
    CONFIGURATION_ASSESSMENT_TITLE: i18n.translate(
      `${this.PLUGIN_ID}.category.${this.CONFIGURATION_ASSESSMENT_ID}`,
      {
        defaultMessage: 'Configuration Assessment',
      },
    ),
    MALWARE_DETECTION_TITLE: i18n.translate(
      `${this.PLUGIN_ID}.category.${this.MALWARE_DETECTION_ID}`,
      {
        defaultMessage: 'Malware Detection',
      },
    ),
    FIM_TITLE: i18n.translate(`${this.PLUGIN_ID}.category.${this.FIM_ID}`, {
      defaultMessage: 'File Integrity Monitoring',
    }),
  };
  private readonly CATEGORY: AppCategory = {
    id: this.PLUGIN_ID,
    label: this.translationMessages.ANALYSIS_PLUGIN_TITLE,
    order: 5000,
  };

  public setup(
    core: CoreSetup,
    _plugins: AnalysisSetupDependencies,
  ): AnalysisSetup | Promise<AnalysisSetup> {
    console.debug('AnalysisPlugin started');

    const ApplicationsMap: Record<string, OmitStrict<App, 'id'>> = {
      [this.ENDPOINT_SECURITY_ID]: {
        title: this.translationMessages.ENDPOINT_SECURITY_TITLE,
        category: this.CATEGORY,
        async mount(params: AppMountParameters) {
          // TODO: Implement the endpoint security application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
      [this.THREAT_INTELLIGENCE_ID]: {
        title: this.translationMessages.THREAT_INTELLIGENCE_TITLE,
        category: this.CATEGORY,
        async mount(params: AppMountParameters) {
          // TODO: Implement the threat intelligence application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
      [this.SECURITY_OPERATIONS_ID]: {
        title: this.translationMessages.SECURITY_OPERATIONS_TITLE,
        category: this.CATEGORY,
        async mount(params: AppMountParameters) {
          // TODO: Implement the security operations application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
      [this.CLOUD_SECURITY_ID]: {
        title: this.translationMessages.CLOUD_SECURITY_TITLE,
        category: this.CATEGORY,
        async mount(params: AppMountParameters) {
          // TODO: Implement the cloud security application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
      [this.CONFIGURATION_ASSESSMENT_ID]: {
        title: this.translationMessages.CONFIGURATION_ASSESSMENT_TITLE,
        async mount(params: AppMountParameters) {
          // TODO: Implement the configuration assessment application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
      [this.MALWARE_DETECTION_ID]: {
        title: this.translationMessages.MALWARE_DETECTION_TITLE,
        async mount(params: AppMountParameters) {
          // TODO: Implement the malware detection application
          const { renderApp } = await import('./application');

          return renderApp(params, {});
        },
      },
      [this.FIM_ID]: {
        title: this.translationMessages.FIM_TITLE,
        async mount(params: AppMountParameters) {
          // TODO: Implement the fim application
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

    core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
      {
        id: this.ENDPOINT_SECURITY_ID,
        title: this.translationMessages.ENDPOINT_SECURITY_TITLE,
        order: 0,
        category: this.CATEGORY,
      },
      {
        id: this.THREAT_INTELLIGENCE_ID,
        title: this.translationMessages.THREAT_INTELLIGENCE_TITLE,
        order: 1,
        category: this.CATEGORY,
      },
      {
        id: this.SECURITY_OPERATIONS_ID,
        title: this.translationMessages.SECURITY_OPERATIONS_TITLE,
        order: 2,
        category: this.CATEGORY,
      },
      {
        id: this.CLOUD_SECURITY_ID,
        title: this.translationMessages.CLOUD_SECURITY_TITLE,
        order: 3,
        category: this.CATEGORY,
      },
    ]);

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
