import { i18n } from '@osd/i18n';
import { PanelInfo } from '../../../common/dashboards/panel-info/panel-info-actions';

const getPassedDescription = () =>
  i18n.translate(
    'wazuh.configurationAssessment.resultDefinitions.passed.description',
    { defaultMessage: "The endpoint meets the check's rules." },
  );

const getFailedDescription = () =>
  i18n.translate(
    'wazuh.configurationAssessment.resultDefinitions.failed.description',
    {
      defaultMessage:
        "The endpoint doesn't meet the check's rules. See the check's remediation.",
    },
  );

const getNotApplicableDescription = () =>
  i18n.translate(
    'wazuh.configurationAssessment.resultDefinitions.notApplicable.description',
    {
      defaultMessage:
        "The check couldn't be evaluated, for example because a file or command it checks doesn't exist.",
    },
  );

const getScoreDescription = () =>
  i18n.translate(
    'wazuh.configurationAssessment.resultDefinitions.score.description',
    {
      defaultMessage:
        'Passed checks as a percentage of passed and failed checks. Not applicable checks are excluded.',
    },
  );

export const getScaResultDefinitions = () => [
  {
    term: i18n.translate(
      'wazuh.configurationAssessment.resultDefinitions.passed.term',
      { defaultMessage: 'Passed' },
    ),
    description: getPassedDescription(),
  },
  {
    term: i18n.translate(
      'wazuh.configurationAssessment.resultDefinitions.failed.term',
      { defaultMessage: 'Failed' },
    ),
    description: getFailedDescription(),
  },
  {
    term: i18n.translate(
      'wazuh.configurationAssessment.resultDefinitions.notApplicable.term',
      { defaultMessage: 'Not applicable' },
    ),
    description: getNotApplicableDescription(),
  },
  {
    term: i18n.translate(
      'wazuh.configurationAssessment.resultDefinitions.score.term',
      { defaultMessage: 'Score' },
    ),
    description: getScoreDescription(),
  },
];

// Keyed by the saved-object ids of the Configuration Assessment dashboard panels.
export const scaPanelInfos: PanelInfo[] = [
  {
    savedObjectId: 'check_result_passed',
    getLabel: () =>
      i18n.translate('wazuh.configurationAssessment.panelInfo.passed', {
        defaultMessage: 'About passed checks',
      }),
    getContent: getPassedDescription,
  },
  {
    savedObjectId: 'check_result_failed',
    getLabel: () =>
      i18n.translate('wazuh.configurationAssessment.panelInfo.failed', {
        defaultMessage: 'About failed checks',
      }),
    getContent: getFailedDescription,
  },
  {
    savedObjectId: 'check_result_not_applicable',
    getLabel: () =>
      i18n.translate('wazuh.configurationAssessment.panelInfo.notApplicable', {
        defaultMessage: 'About not applicable checks',
      }),
    getContent: getNotApplicableDescription,
  },
  {
    savedObjectId: 'check_score',
    getLabel: () =>
      i18n.translate('wazuh.configurationAssessment.panelInfo.score', {
        defaultMessage: 'About the score',
      }),
    getContent: getScoreDescription,
  },
];
