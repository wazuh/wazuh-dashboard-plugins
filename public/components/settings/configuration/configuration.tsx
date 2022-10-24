/*
 * Wazuh app - React component building the configuration component.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Header, BottomBar } from './components';
import { useKbnLoadingIndicator} from '../../common/hooks';
import { useForm } from '../../common/form/hooks';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiSpacer,
  Query,
} from '@elastic/eui';
import store from '../../../redux/store'
import { updateSelectedSettingsSection } from '../../../redux/actions/appStateActions';
import { withUserAuthorizationPrompt, withErrorBoundary, withReduxProvider } from '../../common/hocs';
import { PLUGIN_PLATFORM_NAME, PLUGIN_SETTINGS, PLUGIN_SETTINGS_CATEGORIES, UI_LOGGER_LEVELS, WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../../common/constants';
import { compose } from 'redux';
import { getSettingsDefaultList, groupSettingsByCategory, getCategorySettingByTitle } from '../../../../common/services/settings';
import { Category } from './components/categories/components';
import { WzRequest } from '../../../react-services';
import { UIErrorLog, UIErrorSeverity, UILogLevel, UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { getToasts } from '../../../kibana-services';
import { updateAppConfig } from '../../../redux/actions/appConfigActions';

export type ISetting = {
  key: string
  value: boolean | string | number | object
  description: string
  category: string
  name: string
  readonly?: boolean
  form: { type: string, params: {} }
};

const pluginSettingConfigurableUI = getSettingsDefaultList()
  .filter(categorySetting => categorySetting.isConfigurableFromUI)
  .map(setting => ({ ...setting, category: PLUGIN_SETTINGS_CATEGORIES[setting.category].title}));

const settingsCategoriesSearchBarFilters = [...new Set(pluginSettingConfigurableUI.map(({category}) => category))].sort().map(category => ({value: category}))

const trasnsfromPluginSettingsToFormFields = configuration => Object.fromEntries(
  getSettingsDefaultList()
    .filter(pluginSetting => pluginSetting.isConfigurableFromUI)
    .map(({
      key,
      type,
      validate,
      defaultValue: initialValue,
      uiFormTransformChangedInputValue,
      uiFormTransformConfigurationValueToInputValue,
      uiFormTransformInputValueToConfigurationValue,
      ...rest
    }) => ([
      key,
      {
        type,
        validate: validate?.bind?.(rest),
        transformChangedInputValue: uiFormTransformChangedInputValue?.bind?.(rest),
        transformChangedOutputValue: uiFormTransformInputValueToConfigurationValue?.bind?.(rest),
        initialValue: uiFormTransformConfigurationValueToInputValue ? uiFormTransformConfigurationValueToInputValue.bind(rest)(configuration?.[key] ?? initialValue) : (configuration?.[key] ?? initialValue)
      }
    ]))
);

const WzConfigurationSettingsProvider = (props) => {
  const [loading, setLoading ] = useKbnLoadingIndicator();
  const [query, setQuery] = useState('');
  const currentConfiguration = useSelector(state => state.appConfig.data);

  const { fields, changed, errors, doChanges, undoChanges } = useForm(trasnsfromPluginSettingsToFormFields(currentConfiguration));
  const dispatch = useDispatch();

  useEffect(() => {
    store.dispatch(updateSelectedSettingsSection('configuration'));
  }, []);

  const onChangeSearchQuery = (query) => {
    setQuery(query);
  };

  const visibleSettings = Object.entries(fields)
    .map(([fieldKey, fieldForm]) => ({
      ...fieldForm,
      key: fieldKey,
      category: PLUGIN_SETTINGS_CATEGORIES[PLUGIN_SETTINGS[fieldKey].category].title,
      type: PLUGIN_SETTINGS[fieldKey].type,
      options: PLUGIN_SETTINGS[fieldKey]?.options,
      title: PLUGIN_SETTINGS[fieldKey]?.title,
      description: PLUGIN_SETTINGS[fieldKey]?.description
    }));

  // https://github.com/elastic/eui/blob/aa4cfd7b7c34c2d724405a3ecffde7fe6cf3b50f/src/components/search_bar/query/query.ts#L138-L163
  const search = Query.execute(query.query || query, visibleSettings, ['description', 'key', 'title']);

  const visibleCategories = groupSettingsByCategory(search || visibleSettings)
  // Sort categories to render them in their enum definition order
    .sort((a, b) =>
      (getCategorySettingByTitle(a.category)?.renderOrder || 0) -
      (getCategorySettingByTitle(b.category)?.renderOrder || 0)
    );

  const onSave = async () => {
    setLoading(true);
    try {
      const settingsToUpdate = Object.entries(changed).reduce((accum, [pluginSettingKey, currentValue]) => {
        if(PLUGIN_SETTINGS[pluginSettingKey].isConfigurableFromFile){
          accum.saveOnConfigurationFile = {
            ...accum.saveOnConfigurationFile,
            [pluginSettingKey]: currentValue
          }
        };
        return accum;
      }, {saveOnConfigurationFile: {}});

      const requests = [];

      if(Object.keys(settingsToUpdate.saveOnConfigurationFile).length){
        requests.push(WzRequest.genericReq(
          'PUT', '/utils/configuration',
          settingsToUpdate.saveOnConfigurationFile
        ));
      };
      const responses = await Promise.all(requests);

      // Show the toasts if necessary
      responses.some(({data: { data: {requiresRunningHealthCheck}}}) => requiresRunningHealthCheck) && toastRequiresRunningHealthcheck();
      responses.some(({data: { data: {requiresReloadingBrowserTab}}}) => requiresReloadingBrowserTab) && toastRequiresReloadingBrowserTab();
      responses.some(({data: { data: {requiresRestartingPluginPlatform}}}) => requiresRestartingPluginPlatform) && toastRequiresRestartingPluginPlatform();

      // Update the app configuration frontend-cached setting in memory with the new values
      dispatch(updateAppConfig({
        ...responses.reduce((accum, {data: {data}}) => {
          return {
            ...accum,
            ...(data.updatedConfiguration ? {...data.updatedConfiguration} : {}),
          }
        },{})
      }));

      // Show the success toast
      successToast();

      // Reset the form changed configuration
      doChanges();
    } catch (error) {
      const options: UIErrorLog = {
        context: `${WzConfigurationSettingsProvider.name}.onSave`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error saving the configuration: ${error.message || error}`,
        },
      };

      getErrorOrchestrator().handleError(options);
    } finally {
      setLoading(false);
    };
  };

  return (
    <EuiPage >
      <EuiPageBody className='mgtPage__body' restrictWidth>
        <EuiPageHeader>
          <Header
            query={query}
            setQuery={onChangeSearchQuery}
            searchBarFilters={[{
              type: 'field_value_selection',
              field: 'category',
              name: 'Categories',
              multiSelect: 'or',
              options: settingsCategoriesSearchBarFilters,
            }]}/>
        </EuiPageHeader>
        <EuiFlexGroup direction='column'>
          {visibleCategories && visibleCategories.map(({ category, settings }) => {
            const { description, documentationLink } = getCategorySettingByTitle(category);
            return (
              <Category
                key={`configuration_category_${category}`}
                title={category}
                description={description}
                documentationLink={documentationLink}
                items={settings}
              />
            )
          }
          )}
        </EuiFlexGroup>
        <EuiSpacer size="xxl" />
        {Object.keys(changed).length > 0 && (
          <BottomBar
            errorsCount={Object.keys(errors).length}
            unsavedCount={Object.keys(changed).length}
            onCancel={undoChanges}
            onSave={onSave}
          />
        )}
      </EuiPageBody>
    </EuiPage>
  );
}
export const WzConfigurationSettings = compose (
  withErrorBoundary,
  withReduxProvider,
  withUserAuthorizationPrompt(null, [WAZUH_ROLE_ADMINISTRATOR_NAME])
)(WzConfigurationSettingsProvider);

const toastRequiresReloadingBrowserTab = () => {
  getToasts().add({
    color: 'success',
    title: 'This setting requires you to reload the page to take effect.',
    text: <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
      <EuiFlexItem grow={false}>
        <EuiButton onClick={() => window.location.reload()} size="s">Reload page</EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  });
};

const toastRequiresRunningHealthcheck = () => {
  const toast = getToasts().add({
    color: 'warning',
    title: 'You must execute the health check for the changes to take effect',
    toastLifeTimeMs: 5000,
    text:
      <EuiFlexGroup alignItems="center" gutterSize="s">
        <EuiFlexItem grow={false} >
          <EuiButton onClick={() => {
            getToasts().remove(toast);
            window.location.href = '#/health-check';
          }} size="s">Execute health check</EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
  });
};

const toastRequiresRestartingPluginPlatform = () => {
  getToasts().add({
    color: 'warning',
    title: `You must restart ${PLUGIN_PLATFORM_NAME} for the changes to take effect`,
  });
};

const successToast = () => {
  getToasts().add({
    color: 'success',
    title: 'The configuration has been successfully updated',
  });
};
