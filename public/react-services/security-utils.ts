import WzRequest from './wz-request';

/**
 * Check the current security platform that is installed (xpack, opendistro, searchguard...)
 */
export const checkCurrentSecurityPlatform = async () => {
  try {
    const result = await WzRequest.genericReq('GET', '/elastic/security/current-platform', {});
    const platform = (result.data || {}).platform || 'elastic';

    return platform;
  } catch (error) {
    return Promise.reject(error);
  }
};
