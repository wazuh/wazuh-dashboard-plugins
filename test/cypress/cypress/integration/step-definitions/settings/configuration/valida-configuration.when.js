import { elementTextIncludes, elementIsVisible, getSelector } from '../../../utils/driver';

import { CONFIGURATION_PAGE as pageName } from '../../../utils/pages-constants';
const settingTitle = getSelector('settingTitle', pageName);
const generalPanelTitle = getSelector('generalPanelTitle', pageName);
const generalPanelIndexPatternName = getSelector('generalPanelIndexPatternName', pageName);
const generalPanelIndexPatternDescription = getSelector('generalPanelIndexPatternDescription', pageName);
const generalPanelIndexPatternLabel = getSelector('generalPanelIndexPatternLabel', pageName);
const generalPanelIndexPatternField = getSelector('generalPanelIndexPatternField', pageName);
const generalPanelRequestTimeoutName = getSelector('generalPanelRequestTimeoutName', pageName);
const generalPanelRequestTimeoutDescription = getSelector('generalPanelRequestTimeoutDescription', pageName);
const generalPanelRequestLabel = getSelector('generalPanelRequestLabel', pageName);
const generalPanelRequestField = getSelector('generalPanelRequestField', pageName);
const generalPanelIpSelectorName = getSelector('generalPanelIpSelectorName', pageName);
const generalPanelIpSelectorDescription = getSelector('generalPanelIpSelectorDescription', pageName);
const generalPanelIpSelectorLabel = getSelector('generalPanelIpSelectorLabel', pageName);
const generalPanelIpSelectorField = getSelector('generalPanelIpSelectorField', pageName);
const generalPanelIpIgnoreName = getSelector('generalPanelIpIgnoreName', pageName);
const generalPanelIpIgnoreDescription = getSelector('generalPanelIpIgnoreDescription', pageName);
const generalPanelIpIgnoreLabel = getSelector('generalPanelIpIgnoreLabel', pageName);
const generalPanelIpIgnoreField = getSelector('generalPanelIpIgnoreField', pageName);
const generalPanelCronPrefixName = getSelector('generalPanelCronPrefixName', pageName);
const generalPanelCronPrefixDescription = getSelector('generalPanelCronPrefixDescription', pageName);
const generalPanelCronLabel = getSelector('generalPanelCronLabel', pageName);
const generalPanelCronField = getSelector('generalPanelCronField', pageName);
const generalPanelSamplePrefixName = getSelector('generalPanelSamplePrefixName', pageName);
const generalPanelSamplePrefixDescription = getSelector('generalPanelSamplePrefixDescription', pageName);
const generalPanelSampleLabel = getSelector('generalPanelSampleLabel', pageName);
const generalPanelSampleField = getSelector('generalPanelSampleField', pageName);
const generalPanelManagerAlertsPrefixName = getSelector('generalPanelManagerAlertsPrefixName', pageName);
const generalPanelManagerAlertsPrefixDescription = getSelector('generalPanelManagerAlertsPrefixDescription', pageName);
const generalPanelManagerAlertsLabel = getSelector('generalPanelManagerAlertsLabel', pageName);
const generalPanelManagerAlertsField = getSelector('generalPanelManagerAlertsField', pageName);
const generalPanelLogLevelName = getSelector('generalPanelLogLevelName', pageName);
const generalPanelLogLevelDescription = getSelector('generalPanelLogLevelDescription', pageName);
const generalPanelLogLevelLabel = getSelector('generalPanelLogLevelLabel', pageName);
const generalPanelLogLevelField = getSelector('generalPanelLogLevelField', pageName);
const generalPanelEnrollmentName = getSelector('generalPanelEnrollmentName', pageName);
const generalPanelEnrollmentDescription = getSelector('generalPanelEnrollmentDescription', pageName);
const generalPanelEnrollmentLabel = getSelector('generalPanelEnrollmentLabel', pageName);
const generalPanelEnrollmentField = getSelector('generalPanelEnrollmentField', pageName);
const healthCheckPanelTitle = getSelector('healthCheckPanelTitle', pageName);
const healthCheckPanelIndexPatternPrefixName = getSelector('healthCheckPanelIndexPatternPrefixName', pageName);
const healthCheckPanelIndexPatternPrefixDescription = getSelector('healthCheckPanelIndexPatternPrefixDescription', pageName);
const healthCheckPanelIndexPatterLabel = getSelector('healthCheckPanelIndexPatterLabel', pageName);
const healthCheckPanelIndexPatterField = getSelector('healthCheckPanelIndexPatterField', pageName);
const healthCheckPanelIndexTemplatePrefixName = getSelector('healthCheckPanelIndexTemplatePrefixName', pageName);
const healthCheckPanelIndexTemplatePrefixDescription = getSelector('healthCheckPanelIndexTemplatePrefixDescription', pageName);
const healthCheckPanelIndexTemplateLabel = getSelector('healthCheckPanelIndexTemplateLabel', pageName);
const healthCheckPanelIndexTemplateField = getSelector('healthCheckPanelIndexTemplateField', pageName);
const healthCheckPanelApiConnectionPrefixName = getSelector('healthCheckPanelApiConnectionPrefixName', pageName);
const healthCheckPanelApiConnectionPrefixDescription = getSelector('healthCheckPanelApiConnectionPrefixDescription', pageName);
const healthCheckPanelApiConnectionLabel = getSelector('healthCheckPanelApiConnectionLabel', pageName);
const healthCheckPanelApiConnectionField = getSelector('healthCheckPanelApiConnectionField', pageName);
const healthCheckPanelApiVersionPrefixName = getSelector('healthCheckPanelApiVersionPrefixName', pageName);
const healthCheckPanelApiVersionPrefixDescription = getSelector('healthCheckPanelApiVersionPrefixDescription', pageName);
const healthCheckPanelApiVersionLabel = getSelector('healthCheckPanelApiVersionLabel', pageName);
const healthCheckPanelApiVersionField = getSelector('healthCheckPanelApiVersionField', pageName);
const healthCheckPanelKnowFieldsPrefixName = getSelector('healthCheckPanelKnowFieldsPrefixName', pageName);
const healthCheckPanelKnowFieldsPrefixDescription = getSelector('healthCheckPanelKnowFieldsPrefixDescription', pageName);
const healthCheckPanelKnowFieldsLabel = getSelector('healthCheckPanelKnowFieldsLabel', pageName);
const healthCheckPanelKnowFieldsField = getSelector('healthCheckPanelKnowFieldsField', pageName);
const healthCheckPanelRemoveMetaFieldsPrefixName = getSelector('healthCheckPanelRemoveMetaFieldsPrefixName', pageName);
const healthCheckPanelRemoveMetaFieldsPrefixDescription = getSelector('healthCheckPanelRemoveMetaFieldsPrefixDescription', pageName);
const healthCheckPanelRemoveMetaFieldsPrefixLabel = getSelector('healthCheckPanelRemoveMetaFieldsPrefixLabel', pageName);
const healthCheckPanelRemoveMetaFieldsPrefixField = getSelector('healthCheckPanelRemoveMetaFieldsPrefixField', pageName);
const healthCheckPanelSetBucketPrefixName = getSelector('healthCheckPanelSetBucketPrefixName', pageName);
const healthCheckPanelSetBucketPrefixDescription = getSelector('healthCheckPanelSetBucketPrefixDescription', pageName);
const healthCheckPanelSetBucketLabel = getSelector('healthCheckPanelSetBucketLabel', pageName);
const healthCheckPanelSetBucketField = getSelector('healthCheckPanelSetBucketField', pageName);
const healthCheckPanelSetTimePrefixName = getSelector('healthCheckPanelSetTimePrefixName', pageName);
const healthCheckPanelSetTimePrefixDescription = getSelector('healthCheckPanelSetTimePrefixDescription', pageName);
const healthCheckPanelSetTimeLabel = getSelector('healthCheckPanelSetTimeLabel', pageName);
const healthCheckPanelSetTimeField = getSelector('healthCheckPanelSetTimeField', pageName);
const monitoringPanelTitle = getSelector('monitoringPanelTitle', pageName);
const monitoringPanelStatusName = getSelector('monitoringPanelStatusName', pageName);
const monitoringPanelStatusDescription = getSelector('monitoringPanelStatusDescription', pageName);
const monitoringPanelStatusPatterLabel = getSelector('monitoringPanelStatusPatterLabel', pageName);
const monitoringPanelStatusPatterField = getSelector('monitoringPanelStatusPatterField', pageName);
const monitoringPanelFrequencyName = getSelector('monitoringPanelFrequencyName', pageName);
const monitoringPanelFrequencyDescription = getSelector('monitoringPanelFrequencyDescription', pageName);
const monitoringPanelFrequencyLabel = getSelector('monitoringPanelFrequencyLabel', pageName);
const monitoringPanelFrequencyField = getSelector('monitoringPanelFrequencyField', pageName);
const monitoringPanelIndexShardsName = getSelector('monitoringPanelIndexShardsName', pageName);
const monitoringPanelIndexShardsDescription = getSelector('monitoringPanelIndexShardsDescription', pageName);
const monitoringPanelIndexShardsLabel = getSelector('monitoringPanelIndexShardsLabel', pageName);
const monitoringPanelIndexShardsField = getSelector('monitoringPanelIndexShardsField', pageName);
const monitoringPanelIndexReplicasName = getSelector('monitoringPanelIndexReplicasName', pageName);
const monitoringPanelIndexReplicasDescription = getSelector('monitoringPanelIndexReplicasDescription', pageName);
const monitoringPanelPanelIndexReplicasLabel = getSelector('monitoringPanelPanelIndexReplicasLabel', pageName);
const monitoringPanelIndexReplicasField = getSelector('monitoringPanelIndexReplicasField', pageName);
const monitoringPanelIndexCreationName = getSelector('monitoringPanelIndexCreationName', pageName);
const monitoringPanelIndexCreationDescription = getSelector('monitoringPanelIndexCreationDescription', pageName);
const monitoringPanelIndexCreationLabel = getSelector('monitoringPanelIndexCreationLabel', pageName);
const monitoringPanelIndexCreationField = getSelector('monitoringPanelIndexCreationField', pageName);
const monitoringPanelIndexPatternName = getSelector('monitoringPanelIndexPatternName', pageName);
const monitoringPanelIndexPatternDescription = getSelector('monitoringPanelIndexPatternDescription', pageName);
const monitoringPanelIndexPatternLabel = getSelector('monitoringPanelIndexPatternLabel', pageName);
const monitoringPanelIndexPatternField = getSelector('monitoringPanelIndexPatternField', pageName);
const statisticsPanelTitle = getSelector('statisticsPanelTitle', pageName);
const StatisticsPanelStatusName = getSelector('StatisticsPanelStatusName', pageName);
const StatisticsPanelStatusDescription = getSelector('StatisticsPanelStatusDescription', pageName);
const StatisticsPanelStatusPatterLabel = getSelector('StatisticsPanelStatusPatterLabel', pageName);
const StatisticsPanelStatusPatterField = getSelector('StatisticsPanelStatusPatterField', pageName);
const StatisticsPanelIncludesApisName = getSelector('StatisticsPanelIncludesApisName', pageName);
const StatisticsPanelIncludesApisDescription = getSelector('StatisticsPanelIncludesApisDescription', pageName);
const StatisticsPanelIncludesApisLabel = getSelector('StatisticsPanelIncludesApisLabel', pageName);
const StatisticsPanelIncludesApisField = getSelector('StatisticsPanelIncludesApisField', pageName);
const StatisticsPanelIndexIntervalName = getSelector('StatisticsPanelIndexIntervalName', pageName);
const StatisticsPanelIndexIntervalDescription = getSelector('StatisticsPanelIndexIntervalDescription', pageName);
const StatisticsPanelIndexIntervalLabel = getSelector('StatisticsPanelIndexIntervalLabel', pageName);
const StatisticsPanelIndexIntervalField = getSelector('StatisticsPanelIndexIntervalField', pageName);
const StatisticsPanelIndexNameName = getSelector('StatisticsPanelIndexNameName', pageName);
const StatisticsPanelIndexNameDescription = getSelector('StatisticsPanelIndexNameDescription', pageName);
const StatisticsPanelIndexNameLabel = getSelector('StatisticsPanelIndexNameLabel', pageName);
const StatisticsPanelIndexNameField = getSelector('StatisticsPanelIndexNameField', pageName);
const StatisticsPanelIndexCreationName = getSelector('StatisticsPanelIndexCreationName', pageName);
const StatisticsPanelIndexCreationDescription = getSelector('StatisticsPanelIndexCreationDescription', pageName);
const StatisticsPanelIndexCreationLabel = getSelector('StatisticsPanelIndexCreationLabel', pageName);
const StatisticsPanelIndexCreationField = getSelector('StatisticsPanelIndexCreationField', pageName);
const StatisticsPanelIndexShardsName = getSelector('StatisticsPanelIndexShardsName', pageName);
const StatisticsPanelIndexShardsDescription = getSelector('StatisticsPanelIndexShardsDescription', pageName);
const StatisticsPanelIndexShardsLabel = getSelector('StatisticsPanelIndexShardsLabel', pageName);
const StatisticsPanelIndexShardsField = getSelector('StatisticsPanelIndexShardsField', pageName);
const StatisticsPanelIndexReplicasName = getSelector('StatisticsPanelIndexReplicasName', pageName);
const StatisticsPanelIndexReplicasDescription = getSelector('StatisticsPanelIndexReplicasDescription', pageName);
const StatisticsPanelIndexReplicasLabel = getSelector('StatisticsPanelIndexReplicasLabel', pageName);
const StatisticsPanelIndexReplicasField = getSelector('StatisticsPanelIndexReplicasField', pageName);
const logoPanelTitle = getSelector('logoPanelTitle', pageName);
const LogosCustomizationPanelLogoAppName = getSelector('LogosCustomizationPanelLogoAppName', pageName);
const LogosCustomizationPanelLogoAppDescription = getSelector('LogosCustomizationPanelLogoAppDescription', pageName);
const LogosCustomizationPanelLogoAppPatterLabel = getSelector('LogosCustomizationPanelLogoAppPatterLabel', pageName);
const LogosCustomizationPanelLogoAppPatterField = getSelector('LogosCustomizationPanelLogoAppPatterField', pageName);
const settingSubTitle = getSelector('settingSubTitle', pageName);
const LogosCustomizationPanelLogoReportField = getSelector('LogosCustomizationPanelLogoReportField', pageName);
const LogosCustomizationPanelLogoReportLabel = getSelector('LogosCustomizationPanelLogoReportLabel', pageName);
const LogosCustomizationPanelLogoReportDescription = getSelector('LogosCustomizationPanelLogoReportDescription', pageName);
const LogosCustomizationPanelLogoReportName = getSelector('LogosCustomizationPanelLogoReportName', pageName);
const LogosCustomizationPanelLogoHealthCheckField = getSelector('LogosCustomizationPanelLogoHealthCheckField', pageName);
const LogosCustomizationPanelLogoHealthCheckLabel = getSelector('LogosCustomizationPanelLogoHealthCheckLabel', pageName);
const LogosCustomizationPanelLogoHealthCheckDescription = getSelector('LogosCustomizationPanelLogoHealthCheckDescription', pageName);
const LogosCustomizationPanelLogoHealthCheckName = getSelector('LogosCustomizationPanelLogoHealthCheckName', pageName);
const LogosCustomizationPanelLogosSidebarField = getSelector('LogosCustomizationPanelLogosSidebarField', pageName);
const LogosCustomizationPanelLogosSidebarLabel = getSelector('LogosCustomizationPanelLogosSidebarLabel', pageName);
const LogosCustomizationPanelLogosSidebarDescription = getSelector('LogosCustomizationPanelLogosSidebarDescription', pageName);
const LogosCustomizationPanelLogosSidebarName = getSelector('LogosCustomizationPanelLogosSidebarName', pageName);


const texts = require('../../../../fixtures/configuration.panel.text.json');

Then('The app current settings are displayed', () => {
    elementTextIncludes(settingTitle, texts.configurationTitle);
    (Cypress.env('type') == 'wzd') ? elementTextIncludes(settingSubTitle, 'Configuration file located at /usr/share/wazuh-dashboard/data/wazuh/config/wazuh.yml') : elementTextIncludes(settingSubTitle, texts.configurationDescription);

    elementIsVisible(generalPanelTitle);
    elementIsVisible(generalPanelIndexPatternName);
    elementIsVisible(generalPanelIndexPatternDescription);
    elementIsVisible(generalPanelIndexPatternLabel);
    elementIsVisible(generalPanelIndexPatternField);
    elementIsVisible(generalPanelRequestTimeoutName);
    elementIsVisible(generalPanelRequestTimeoutDescription);
    elementIsVisible(generalPanelRequestLabel);
    elementIsVisible(generalPanelRequestField);
    elementIsVisible(generalPanelIpSelectorName);
    elementIsVisible(generalPanelIpSelectorDescription);
    elementIsVisible(generalPanelIpSelectorLabel);
    elementIsVisible(generalPanelIpSelectorField);
    elementIsVisible(generalPanelIpIgnoreName);
    elementIsVisible(generalPanelIpIgnoreDescription);
    elementIsVisible(generalPanelIpIgnoreLabel);
    elementIsVisible(generalPanelIpIgnoreField);
    elementIsVisible(generalPanelCronPrefixName);
    elementIsVisible(generalPanelCronPrefixDescription);
    elementIsVisible(generalPanelCronLabel);
    elementIsVisible(generalPanelCronField);
    elementIsVisible(generalPanelSamplePrefixName);
    elementIsVisible(generalPanelSamplePrefixDescription);
    elementIsVisible(generalPanelSampleLabel);
    elementIsVisible(generalPanelSampleField);
    elementIsVisible(generalPanelManagerAlertsPrefixName);
    elementIsVisible(generalPanelManagerAlertsPrefixDescription);
    elementIsVisible(generalPanelManagerAlertsLabel);
    elementIsVisible(generalPanelManagerAlertsField);
    elementIsVisible(generalPanelLogLevelName);
    elementIsVisible(generalPanelLogLevelDescription);
    elementIsVisible(generalPanelLogLevelLabel);
    elementIsVisible(generalPanelLogLevelField);
    elementIsVisible(generalPanelEnrollmentName);
    elementIsVisible(generalPanelEnrollmentDescription);
    elementIsVisible(generalPanelEnrollmentLabel);
    elementIsVisible(generalPanelEnrollmentField);
    elementIsVisible(healthCheckPanelTitle);
    elementIsVisible(healthCheckPanelIndexPatternPrefixName);
    elementIsVisible(healthCheckPanelIndexPatternPrefixDescription);
    elementIsVisible(healthCheckPanelIndexPatterLabel);
    elementIsVisible(healthCheckPanelIndexPatterField);
    elementIsVisible(healthCheckPanelIndexTemplatePrefixName);
    elementIsVisible(healthCheckPanelIndexTemplatePrefixDescription);
    elementIsVisible(healthCheckPanelIndexTemplateLabel);
    elementIsVisible(healthCheckPanelIndexTemplateField);
    elementIsVisible(healthCheckPanelApiConnectionPrefixName);
    elementIsVisible(healthCheckPanelApiConnectionPrefixDescription);
    elementIsVisible(healthCheckPanelApiConnectionLabel);
    elementIsVisible(healthCheckPanelApiConnectionField);
    elementIsVisible(healthCheckPanelApiVersionPrefixName);
    elementIsVisible(healthCheckPanelApiVersionPrefixDescription);
    elementIsVisible(healthCheckPanelApiVersionLabel);
    elementIsVisible(healthCheckPanelApiVersionField);
    elementIsVisible(healthCheckPanelKnowFieldsPrefixName);
    elementIsVisible(healthCheckPanelKnowFieldsPrefixDescription);
    elementIsVisible(healthCheckPanelKnowFieldsLabel);
    elementIsVisible(healthCheckPanelKnowFieldsField);
    elementIsVisible(healthCheckPanelRemoveMetaFieldsPrefixName);
    elementIsVisible(healthCheckPanelRemoveMetaFieldsPrefixDescription);
    elementIsVisible(healthCheckPanelRemoveMetaFieldsPrefixLabel);
    elementIsVisible(healthCheckPanelRemoveMetaFieldsPrefixField);
    elementIsVisible(healthCheckPanelSetBucketPrefixName);
    elementIsVisible(healthCheckPanelSetBucketPrefixDescription);
    elementIsVisible(healthCheckPanelSetBucketLabel);
    elementIsVisible(healthCheckPanelSetBucketField);
    elementIsVisible(healthCheckPanelSetTimePrefixName);
    elementIsVisible(healthCheckPanelSetTimePrefixDescription);
    elementIsVisible(healthCheckPanelSetTimeLabel);
    elementIsVisible(healthCheckPanelSetTimeField);

    elementIsVisible(monitoringPanelTitle);
    elementIsVisible(monitoringPanelStatusName);
    elementIsVisible(monitoringPanelStatusDescription);
    elementIsVisible(monitoringPanelStatusPatterLabel);
    elementIsVisible(monitoringPanelStatusPatterField);
    elementIsVisible(monitoringPanelFrequencyName);
    elementIsVisible(monitoringPanelFrequencyDescription);
    elementIsVisible(monitoringPanelFrequencyLabel);
    elementIsVisible(monitoringPanelFrequencyField);
    elementIsVisible(monitoringPanelIndexShardsName);
    elementIsVisible(monitoringPanelIndexShardsDescription);
    elementIsVisible(monitoringPanelIndexShardsLabel);
    elementIsVisible(monitoringPanelIndexShardsField);
    elementIsVisible(monitoringPanelIndexReplicasName);
    elementIsVisible(monitoringPanelIndexReplicasDescription);
    elementIsVisible(monitoringPanelPanelIndexReplicasLabel);
    elementIsVisible(monitoringPanelIndexReplicasField);
    elementIsVisible(monitoringPanelIndexCreationName);
    elementIsVisible(monitoringPanelIndexCreationDescription);
    elementIsVisible(monitoringPanelIndexCreationLabel);
    elementIsVisible(monitoringPanelIndexCreationField);
    elementIsVisible(monitoringPanelIndexPatternName);
    elementIsVisible(monitoringPanelIndexPatternDescription);
    elementIsVisible(monitoringPanelIndexPatternLabel);
    elementIsVisible(monitoringPanelIndexPatternField);

    elementIsVisible(statisticsPanelTitle);
    elementIsVisible(StatisticsPanelStatusName);
    elementIsVisible(StatisticsPanelStatusDescription);
    elementIsVisible(StatisticsPanelStatusPatterLabel);
    elementIsVisible(StatisticsPanelStatusPatterField);
    elementIsVisible(StatisticsPanelIncludesApisName);
    elementIsVisible(StatisticsPanelIncludesApisDescription);
    elementIsVisible(StatisticsPanelIncludesApisLabel);
    elementIsVisible(StatisticsPanelIncludesApisField);
    elementIsVisible(StatisticsPanelIndexIntervalName);
    elementIsVisible(StatisticsPanelIndexIntervalDescription);
    elementIsVisible(StatisticsPanelIndexIntervalLabel);
    elementIsVisible(StatisticsPanelIndexIntervalField);
    elementIsVisible(StatisticsPanelIndexNameName);
    elementIsVisible(StatisticsPanelIndexNameDescription);
    elementIsVisible(StatisticsPanelIndexNameLabel);
    elementIsVisible(StatisticsPanelIndexNameField);
    elementIsVisible(StatisticsPanelIndexCreationName);
    elementIsVisible(StatisticsPanelIndexCreationDescription);
    elementIsVisible(StatisticsPanelIndexCreationLabel);
    elementIsVisible(StatisticsPanelIndexCreationField);
    elementIsVisible(StatisticsPanelIndexShardsName);
    elementIsVisible(StatisticsPanelIndexShardsDescription);
    elementIsVisible(StatisticsPanelIndexShardsLabel);
    elementIsVisible(StatisticsPanelIndexShardsField);
    elementIsVisible(StatisticsPanelIndexReplicasName);
    elementIsVisible(StatisticsPanelIndexReplicasDescription);
    elementIsVisible(StatisticsPanelIndexReplicasLabel);
    elementIsVisible(StatisticsPanelIndexReplicasField);

    elementIsVisible(logoPanelTitle);
    elementIsVisible(LogosCustomizationPanelLogoAppName);
    elementIsVisible(LogosCustomizationPanelLogoAppDescription);
    elementIsVisible(LogosCustomizationPanelLogoAppPatterLabel);
    elementIsVisible(LogosCustomizationPanelLogoAppPatterField);
    elementIsVisible(LogosCustomizationPanelLogosSidebarName);
    elementIsVisible(LogosCustomizationPanelLogosSidebarDescription);
    elementIsVisible(LogosCustomizationPanelLogosSidebarLabel);
    elementIsVisible(LogosCustomizationPanelLogosSidebarField);
    elementIsVisible(LogosCustomizationPanelLogoHealthCheckName);
    elementIsVisible(LogosCustomizationPanelLogoHealthCheckDescription);
    elementIsVisible(LogosCustomizationPanelLogoHealthCheckLabel);
    elementIsVisible(LogosCustomizationPanelLogoHealthCheckField);
    elementIsVisible(LogosCustomizationPanelLogoReportName);
    elementIsVisible(LogosCustomizationPanelLogoReportDescription);
    elementIsVisible(LogosCustomizationPanelLogoReportLabel);
    elementIsVisible(LogosCustomizationPanelLogoReportField);


    //check the title, subtitle and label texts
    elementTextIncludes(generalPanelTitle, texts.Panel[0].name);
    elementTextIncludes(generalPanelIndexPatternName, texts.Panel[0].items[0].title);
    elementTextIncludes(generalPanelIndexPatternDescription, texts.Panel[0].items[0].subTitle);
    elementTextIncludes(generalPanelIndexPatternLabel, texts.Panel[0].items[0].label);
    elementTextIncludes(generalPanelRequestTimeoutName, texts.Panel[0].items[1].title);
    (Cypress.env('type') == 'wzd') ? elementTextIncludes(generalPanelRequestTimeoutDescription, 'Maximum time, in milliseconds, the app will wait for an API response when making requests to it. It will be ignored if the value is set under 1500 milliseconds.') : elementTextIncludes(generalPanelRequestTimeoutDescription, texts.Panel[0].items[1].subTitle);
    elementTextIncludes(generalPanelRequestLabel, texts.Panel[0].items[1].label);
    elementTextIncludes(generalPanelIpSelectorName, texts.Panel[0].items[2].title);
    (Cypress.env('type') == 'wzd') ? elementTextIncludes(generalPanelIpSelectorDescription, 'Define if the user is allowed to change the selected index pattern directly from the top menu bar.') : elementTextIncludes(generalPanelIpSelectorDescription, texts.Panel[0].items[2].subTitle);
    elementTextIncludes(generalPanelIpSelectorLabel, texts.Panel[0].items[2].label);
    elementTextIncludes(generalPanelIpIgnoreName, texts.Panel[0].items[3].title);
    elementTextIncludes(generalPanelIpIgnoreDescription, texts.Panel[0].items[3].subTitle);
    elementTextIncludes(generalPanelIpIgnoreLabel, texts.Panel[0].items[3].label);
    elementTextIncludes(generalPanelCronPrefixName, texts.Panel[0].items[4].title);
    elementTextIncludes(generalPanelCronPrefixDescription, texts.Panel[0].items[4].subTitle);
    elementTextIncludes(generalPanelCronLabel, texts.Panel[0].items[4].label);
    elementTextIncludes(generalPanelSamplePrefixName, texts.Panel[0].items[5].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(generalPanelSamplePrefixDescription, 'Define the index name prefix of sample alerts. It must match the template used by the index pattern to avoid unknown fields in dashboards.') : elementTextIncludes(generalPanelSamplePrefixDescription, texts.Panel[0].items[5].subTitle);

    elementTextIncludes(generalPanelManagerAlertsPrefixName, texts.Panel[0].items[6].title);
    (Cypress.env('type') == 'wzd') ? elementTextIncludes(generalPanelManagerAlertsPrefixDescription, 'Hide the alerts of the manager in every dashboard.') : elementTextIncludes(generalPanelManagerAlertsPrefixDescription, texts.Panel[0].items[6].subTitle);
    elementTextIncludes(generalPanelManagerAlertsLabel, texts.Panel[0].items[6].label);
    elementTextIncludes(generalPanelLogLevelName, texts.Panel[0].items[7].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(generalPanelLogLevelDescription, 'Logging level of the App.') : elementTextIncludes(generalPanelLogLevelDescription, texts.Panel[0].items[7].subTitle);

    elementTextIncludes(generalPanelLogLevelLabel, texts.Panel[0].items[7].label);
    elementTextIncludes(generalPanelEnrollmentName, texts.Panel[0].items[8].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(generalPanelEnrollmentDescription, 'Specifies the Wazuh registration server, used for the agent enrollment.') : elementTextIncludes(generalPanelEnrollmentDescription, texts.Panel[0].items[8].subTitle);

    elementTextIncludes(generalPanelEnrollmentLabel, texts.Panel[0].items[8].label);


    elementTextIncludes(healthCheckPanelTitle, texts.Panel[1].name);
    elementTextIncludes(healthCheckPanelIndexPatternPrefixName, texts.Panel[1].items[0].title);
    elementTextIncludes(healthCheckPanelIndexPatternPrefixDescription, texts.Panel[1].items[0].subTitle);
    elementTextIncludes(healthCheckPanelIndexPatterLabel, texts.Panel[1].items[0].label);
    elementTextIncludes(healthCheckPanelIndexTemplatePrefixName, texts.Panel[1].items[1].title);
    elementTextIncludes(healthCheckPanelIndexTemplatePrefixDescription, texts.Panel[1].items[1].subTitle);
    elementTextIncludes(healthCheckPanelIndexTemplateLabel, texts.Panel[1].items[1].label);
    elementTextIncludes(healthCheckPanelApiConnectionPrefixName, texts.Panel[1].items[2].title);
    elementTextIncludes(healthCheckPanelApiConnectionPrefixDescription, texts.Panel[1].items[2].subTitle);
    elementTextIncludes(healthCheckPanelApiConnectionLabel, texts.Panel[1].items[2].label);
    elementTextIncludes(healthCheckPanelApiVersionPrefixName, texts.Panel[1].items[3].title);
    elementTextIncludes(healthCheckPanelApiVersionPrefixDescription, texts.Panel[1].items[3].subTitle);
    elementTextIncludes(healthCheckPanelApiVersionLabel, texts.Panel[1].items[3].label);
    elementTextIncludes(healthCheckPanelKnowFieldsPrefixName, texts.Panel[1].items[4].title);
    elementTextIncludes(healthCheckPanelKnowFieldsPrefixDescription, texts.Panel[1].items[4].subTitle);
    elementTextIncludes(healthCheckPanelKnowFieldsLabel, texts.Panel[1].items[4].label);
    elementTextIncludes(healthCheckPanelRemoveMetaFieldsPrefixName, texts.Panel[1].items[5].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(healthCheckPanelRemoveMetaFieldsPrefixDescription, 'Change the default value of the Wazuh dashboard metaField configuration') : elementTextIncludes(healthCheckPanelRemoveMetaFieldsPrefixDescription, texts.Panel[1].items[5].subTitle);

    elementTextIncludes(healthCheckPanelRemoveMetaFieldsPrefixLabel, texts.Panel[1].items[5].label);
    elementTextIncludes(healthCheckPanelSetBucketPrefixName, texts.Panel[1].items[6].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(healthCheckPanelSetBucketPrefixDescription, 'Change the default value of the Wazuh dashboard max buckets configuration') : elementTextIncludes(healthCheckPanelSetBucketPrefixDescription, texts.Panel[1].items[6].subTitle);

    elementTextIncludes(healthCheckPanelSetBucketLabel, texts.Panel[1].items[6].label);
    elementTextIncludes(healthCheckPanelSetTimePrefixName, texts.Panel[1].items[7].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(healthCheckPanelSetTimePrefixDescription, 'Change the default value of the Wazuh dashboard timeFilter configuration') : elementTextIncludes(healthCheckPanelSetTimePrefixDescription, texts.Panel[1].items[7].subTitle);

    elementTextIncludes(healthCheckPanelSetTimeLabel, texts.Panel[1].items[7].label);


    elementTextIncludes(monitoringPanelTitle, texts.Panel[2].name);

    elementTextIncludes(monitoringPanelStatusName, texts.Panel[2].items[0].title);
    elementTextIncludes(monitoringPanelStatusDescription, texts.Panel[2].items[0].subTitle);
    elementTextIncludes(monitoringPanelStatusPatterLabel, texts.Panel[2].items[0].label);
    elementTextIncludes(monitoringPanelFrequencyName, texts.Panel[2].items[1].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(monitoringPanelFrequencyDescription, 'Frequency, in seconds, of API requests to get the state of the agents and create a new document in the wazuh-monitoring index with this data.') : elementTextIncludes(monitoringPanelFrequencyDescription, texts.Panel[2].items[1].subTitle);

    elementTextIncludes(monitoringPanelFrequencyLabel, texts.Panel[2].items[1].label);
    elementTextIncludes(monitoringPanelIndexShardsName, texts.Panel[2].items[2].title);
    elementTextIncludes(monitoringPanelIndexShardsDescription, texts.Panel[2].items[2].subTitle);
    elementTextIncludes(monitoringPanelIndexShardsLabel, texts.Panel[2].items[2].label);
    elementTextIncludes(monitoringPanelIndexReplicasName, texts.Panel[2].items[3].title);
    elementTextIncludes(monitoringPanelIndexReplicasDescription, texts.Panel[2].items[3].subTitle);
    elementTextIncludes(monitoringPanelPanelIndexReplicasLabel, texts.Panel[2].items[3].label);
    elementTextIncludes(monitoringPanelIndexCreationName, texts.Panel[2].items[4].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(monitoringPanelIndexCreationDescription, 'Define the interval in which a new wazuh-monitoring index will be created.') : elementTextIncludes(monitoringPanelIndexCreationDescription, texts.Panel[2].items[4].subTitle);

    elementTextIncludes(monitoringPanelIndexCreationLabel, texts.Panel[2].items[4].label);
    elementTextIncludes(monitoringPanelIndexPatternName, texts.Panel[2].items[5].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(monitoringPanelIndexPatternDescription, 'Default index pattern to use for Wazuh monitoring.') : elementTextIncludes(monitoringPanelIndexPatternDescription, texts.Panel[2].items[5].subTitle);

    elementTextIncludes(monitoringPanelIndexPatternLabel, texts.Panel[2].items[5].label);

    elementTextIncludes(statisticsPanelTitle, texts.Panel[3].name);
    elementTextIncludes(StatisticsPanelStatusName, texts.Panel[3].items[0].title);
    elementTextIncludes(StatisticsPanelStatusDescription, texts.Panel[3].items[0].subTitle);
    elementTextIncludes(StatisticsPanelStatusPatterLabel, texts.Panel[3].items[0].label);
    elementTextIncludes(StatisticsPanelIncludesApisName, texts.Panel[3].items[1].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(StatisticsPanelIncludesApisDescription, 'Enter the ID of the hosts you want to save data from, leave this empty to run the task on every host.') : elementTextIncludes(StatisticsPanelIncludesApisDescription, texts.Panel[3].items[1].subTitle);

    elementTextIncludes(StatisticsPanelIncludesApisLabel, texts.Panel[3].items[1].label);
    elementTextIncludes(StatisticsPanelIndexIntervalName, texts.Panel[3].items[2].title);
    elementTextIncludes(StatisticsPanelIndexIntervalDescription, texts.Panel[3].items[2].subTitle);
    elementTextIncludes(StatisticsPanelIndexIntervalLabel, texts.Panel[3].items[2].label);
    elementTextIncludes(StatisticsPanelIndexNameName, texts.Panel[3].items[3].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(StatisticsPanelIndexNameDescription, 'Define the name of the index in which the documents will be saved.') : elementTextIncludes(StatisticsPanelIndexNameDescription, texts.Panel[3].items[3].subTitle);

    elementTextIncludes(StatisticsPanelIndexNameLabel, texts.Panel[3].items[3].label);
    elementTextIncludes(StatisticsPanelIndexCreationName, texts.Panel[3].items[4].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(StatisticsPanelIndexCreationDescription, 'Define the interval in which a new index will be created.') : elementTextIncludes(StatisticsPanelIndexCreationDescription, texts.Panel[3].items[4].subTitle);

    elementTextIncludes(StatisticsPanelIndexCreationLabel, texts.Panel[3].items[4].label);
    elementTextIncludes(StatisticsPanelIndexShardsName, texts.Panel[3].items[5].title);
    elementTextIncludes(StatisticsPanelIndexShardsDescription, texts.Panel[3].items[5].subTitle);
    elementTextIncludes(StatisticsPanelIndexShardsLabel, texts.Panel[3].items[5].label);
    elementTextIncludes(StatisticsPanelIndexReplicasName, texts.Panel[3].items[6].title);
    elementTextIncludes(StatisticsPanelIndexReplicasDescription, texts.Panel[3].items[6].subTitle);
    elementTextIncludes(StatisticsPanelIndexReplicasLabel, texts.Panel[3].items[6].label);
    elementTextIncludes(logoPanelTitle, texts.Panel[4].name);
    elementTextIncludes(LogosCustomizationPanelLogoAppName, texts.Panel[4].items[0].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(LogosCustomizationPanelLogoAppDescription, 'Set the name of the app logo stored at /plugins/wazuh/public/assets/') : elementTextIncludes(LogosCustomizationPanelLogoAppDescription, texts.Panel[4].items[0].subTitle);


    elementTextIncludes(LogosCustomizationPanelLogoAppPatterLabel, texts.Panel[4].items[0].label);
    elementTextIncludes(LogosCustomizationPanelLogosSidebarName, texts.Panel[4].items[1].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(LogosCustomizationPanelLogosSidebarDescription, 'Set the name of the sidebar logo stored at /plugins/wazuh/public/assets') : elementTextIncludes(LogosCustomizationPanelLogosSidebarDescription, texts.Panel[4].items[1].subTitle);

    elementTextIncludes(LogosCustomizationPanelLogosSidebarLabel, texts.Panel[4].items[1].label);
    elementTextIncludes(LogosCustomizationPanelLogoHealthCheckName, texts.Panel[4].items[2].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(LogosCustomizationPanelLogoHealthCheckDescription, 'Set the name of the health-check logo stored at /plugins/wazuh/public/assets/') : elementTextIncludes(LogosCustomizationPanelLogoHealthCheckDescription, texts.Panel[4].items[2].subTitle);

    elementTextIncludes(LogosCustomizationPanelLogoHealthCheckLabel, texts.Panel[4].items[2].label);
    elementTextIncludes(LogosCustomizationPanelLogoReportName, texts.Panel[4].items[3].title);

    (Cypress.env('type') == 'wzd') ? elementTextIncludes(LogosCustomizationPanelLogoReportDescription, 'Set the name of the reports logo (.png) stored at /plugins/wazuh/public/assets/') : elementTextIncludes(LogosCustomizationPanelLogoReportDescription, texts.Panel[4].items[3].subTitle);

    elementTextIncludes(LogosCustomizationPanelLogoReportLabel, texts.Panel[4].items[3].label);
})