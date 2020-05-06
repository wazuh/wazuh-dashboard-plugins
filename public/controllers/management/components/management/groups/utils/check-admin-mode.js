import { WzRequest } from '../../../../../../react-services/wz-request';

/**
 * Check de admin mode and return true or false(if admin mode is not set in the wazuh.yml the default value is true)
 */
const checkAdminMode = async () => {
  try {
    let admin = true;
    const result = await WzRequest.genericReq(
      'GET',
      '/utils/configuration',
      {}
    );
    const data = ((result || {}).data || {}).data || {};
    if (Object.keys(data).includes('admin')) admin = data.admin;
    return admin;
  } catch (error) {
    return Promise.error(error);
  }
};

export default checkAdminMode;
