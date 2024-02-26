import { formatBytes } from '../../common/services/file-size';
import { formatLabelValuePair } from '../../common/services/settings';

export function enhanceConfiguration(configuration) {
  configuration.registerCategory = function ({ id, ...rest }) {
    if (!this._categories) {
      this._categories = new Map();
    }
    if (this._categories.has(id)) {
      this.logger.error(`Registered category ${id}`);
      throw new Error(`Category ${id} exists`);
    }
    this._categories.set(id, rest);
    this.logger.debug(`Registered category ${id}`);
  };

  configuration.getUniqueCategories = function () {
    return [
      ...new Set(
        Array.from(this._settings.entries())
          .filter(
            ([, { isConfigurableFromSettings }]) => isConfigurableFromSettings,
          )
          .map(([, { category }]) => category),
      ),
    ]
      .map(categoryID => this._categories.get(String(categoryID)))
      .sort((categoryA, categoryB) => {
        if (categoryA.title > categoryB.title) {
          return 1;
        } else if (categoryA.title < categoryB.title) {
          return -1;
        }
        return 0;
      });
  };

  configuration.getSettingDescription = function (key: string) {
    const { description, options } = this._settings.get(key);
    return [
      description,
      ...(options?.select
        ? [
            `Allowed values: ${options.select
              .map(({ text, value }) => formatLabelValuePair(text, value))
              .join(', ')}.`,
          ]
        : []),
      ...(options?.switch
        ? [
            `Allowed values: ${['enabled', 'disabled']
              .map(s =>
                formatLabelValuePair(
                  options.switch.values[s].label,
                  options.switch.values[s].value,
                ),
              )
              .join(', ')}.`,
          ]
        : []),
      ...(options?.number && 'min' in options.number
        ? [`Minimum value: ${options.number.min}.`]
        : []),
      ...(options?.number && 'max' in options.number
        ? [`Maximum value: ${options.number.max}.`]
        : []),
      // File extensions
      ...(options?.file?.extensions
        ? [`Supported extensions: ${options.file.extensions.join(', ')}.`]
        : []),
      // File recommended dimensions
      ...(options?.file?.recommended?.dimensions
        ? [
            `Recommended dimensions: ${
              options.file.recommended.dimensions.width
            }x${options.file.recommended.dimensions.height}${
              options.file.recommended.dimensions.unit || ''
            }.`,
          ]
        : []),
      // File size
      ...(options?.file?.size &&
      typeof options.file.size.minBytes !== 'undefined'
        ? [`Minimum file size: ${formatBytes(options.file.size.minBytes)}.`]
        : []),
      ...(options?.file?.size &&
      typeof options.file.size.maxBytes !== 'undefined'
        ? [`Maximum file size: ${formatBytes(options.file.size.maxBytes)}.`]
        : []),
      // Multi line text
      ...(options?.maxRows && typeof options.maxRows !== 'undefined'
        ? [`Maximum amount of lines: ${options.maxRows}.`]
        : []),
      ...(options?.minRows && typeof options.minRows !== 'undefined'
        ? [`Minimum amount of lines: ${options.minRows}.`]
        : []),
      ...(options?.maxLength && typeof options.maxLength !== 'undefined'
        ? [`Maximum lines length is ${options.maxLength} characters.`]
        : []),
    ].join(' ');
  };

  //  Group the settings by category
  configuration.groupSettingsByCategory = function (_settings) {
    const settings = (
      _settings && Array.isArray(_settings)
        ? Array.from(this._settings.entries()).filter(([key]) =>
            _settings.includes(key),
          )
        : Array.from(this._settings.entries())
    ).map(([key, value]) => ({
      ...value,
      key,
    }));

    const settingsSortedByCategories = settings
      .sort((settingA, settingB) => settingA.key?.localeCompare?.(settingB.key))
      .reduce(
        (accum, pluginSettingConfiguration) => ({
          ...accum,
          [pluginSettingConfiguration.category]: [
            ...(accum[pluginSettingConfiguration.category] || []),
            { ...pluginSettingConfiguration },
          ],
        }),
        {},
      );

    return Object.entries(settingsSortedByCategories)
      .map(([category, settings]) => ({
        category: this._categories.get(String(category)),
        settings,
      }))
      .filter(categoryEntry => categoryEntry.settings.length);
  };
}
