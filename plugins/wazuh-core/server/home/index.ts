import IndexPatternDefaultFields from './fields-home.json';

export const registerHomeApp = (
  services,
  initializationTaskCreatorIndexPattern,
) => {
  services.initialization.register(
    initializationTaskCreatorIndexPattern({
      getIndexPatternID: async () => 'wazuh-home-*',
      taskName: 'index-pattern:wazuh-home',
      options: {
        savedObjectOverwrite: {
          timeFieldName: '@timestamp',
        },
        fieldsNoIndices: IndexPatternDefaultFields,
      },
      // configurationSettingKey: 'checks.statistics', // TODO: create new setting
    }),
  );
};
