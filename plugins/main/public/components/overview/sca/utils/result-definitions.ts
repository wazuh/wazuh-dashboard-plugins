import { i18n } from '@osd/i18n';
import { PanelInfo } from '../../../common/dashboards/panel-info/panel-info-actions';

const getScoreDescription = () =>
  i18n.translate(
    'wazuh.configurationAssessment.resultDefinitions.score.description',
    {
      defaultMessage:
        'Share of evaluated checks that passed: passed ÷ (passed + failed). Not applicable checks are left out.',
    },
  );

// Defines the result of a single check, for the About flyout.
export const getScaResultDefinitions = () => [
  {
    term: i18n.translate(
      'wazuh.configurationAssessment.resultDefinitions.passed.term',
      { defaultMessage: 'Passed' },
    ),
    description: i18n.translate(
      'wazuh.configurationAssessment.resultDefinitions.passed.description',
      { defaultMessage: 'The endpoint is configured as the check recommends.' },
    ),
  },
  {
    term: i18n.translate(
      'wazuh.configurationAssessment.resultDefinitions.failed.term',
      { defaultMessage: 'Failed' },
    ),
    description: i18n.translate(
      'wazuh.configurationAssessment.resultDefinitions.failed.description',
      {
        defaultMessage:
          "The endpoint isn't configured as the check recommends. The check's remediation explains how to fix it.",
      },
    ),
  },
  {
    term: i18n.translate(
      'wazuh.configurationAssessment.resultDefinitions.notApplicable.term',
      { defaultMessage: 'Not applicable' },
    ),
    description: i18n.translate(
      'wazuh.configurationAssessment.resultDefinitions.notApplicable.description',
      {
        defaultMessage:
          "The check couldn't be evaluated on the endpoint: a file it reads is missing, a command failed, or the policy doesn't apply to that system. It counts as neither passed nor failed.",
      },
    ),
  },
  {
    term: i18n.translate(
      'wazuh.configurationAssessment.resultDefinitions.score.term',
      { defaultMessage: 'Score' },
    ),
    description: getScoreDescription(),
  },
];

// Describes what each dashboard panel counts, keyed by the panel's saved-object id.
export const scaPanelInfos: PanelInfo[] = [
  {
    savedObjectId: 'check_result_passed',
    getLabel: () =>
      i18n.translate('wazuh.configurationAssessment.panelInfo.passed.label', {
        defaultMessage: 'About passed checks',
      }),
    getContent: () =>
      i18n.translate(
        'wazuh.configurationAssessment.panelInfo.passed.description',
        {
          defaultMessage:
            'Number of checks where the endpoint is configured as the check recommends.',
        },
      ),
  },
  {
    savedObjectId: 'check_result_failed',
    getLabel: () =>
      i18n.translate('wazuh.configurationAssessment.panelInfo.failed.label', {
        defaultMessage: 'About failed checks',
      }),
    getContent: () =>
      i18n.translate(
        'wazuh.configurationAssessment.panelInfo.failed.description',
        {
          defaultMessage:
            "Number of checks where the endpoint isn't configured as the check recommends. Each check's remediation explains how to fix it.",
        },
      ),
  },
  {
    savedObjectId: 'check_result_not_applicable',
    getLabel: () =>
      i18n.translate(
        'wazuh.configurationAssessment.panelInfo.notApplicable.label',
        {
          defaultMessage: 'About not applicable checks',
        },
      ),
    getContent: () =>
      i18n.translate(
        'wazuh.configurationAssessment.panelInfo.notApplicable.description',
        {
          defaultMessage:
            "Number of checks that couldn't be evaluated on the endpoint: a file they read is missing, a command failed, or the policy doesn't apply to that system. They count as neither passed nor failed.",
        },
      ),
  },
  {
    savedObjectId: 'check_score',
    getLabel: () =>
      i18n.translate('wazuh.configurationAssessment.panelInfo.score.label', {
        defaultMessage: 'About the score',
      }),
    getContent: getScoreDescription,
  },
];
