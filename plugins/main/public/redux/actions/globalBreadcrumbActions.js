/**
 * Updates Global breacrumb
 * @param breadcrumb
 */
export const updateGlobalBreadcrumb = breadcrumb => {
  return {
    type: 'UPDATE_GLOBAL_BREADCRUMB',
    breadcrumb: breadcrumb
  };
};
