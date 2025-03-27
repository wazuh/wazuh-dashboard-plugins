import { getVersionList } from '../../../../plugin-services';

export const getOptionsToUpgrade = async () => {
  const versions = await getVersionList().getVersions();
  const options: { value: string; text: string }[] = [];

  for (const item of versions.apis_available_updates) {
    if (item?.last_available_major) {
      options.push({
        text: item.last_available_major.tag,
        value: item.last_available_major.tag,
      });
    }

    if (item?.last_available_minor) {
      options.push({
        text: item.last_available_minor.tag,
        value: item.last_available_minor.tag,
      });
    }

    if (item?.last_available_patch) {
      options.push({
        text: item.last_available_patch.tag,
        value: item.last_available_patch.tag,
      });
    }
  }

  return options;
};
