/*
 * Wazuh app - React component for reporting.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * Toggle the updating of the table
 * @param {Boolean} isProcessing
 */
export const updateIsProcessing = isProcessing => {
  return {
    type: 'UPDATE_IS_PROCESSING',
    isProcessing: isProcessing
  };
};

/**
 * Update the list of items to remove
 * @param {Array} itemList
 */
export const updateListItemsForRemove = itemList => {
  return {
    type: 'UPDATE_LIST_ITEMS_FOR_REMOVE',
    itemList: itemList
  };
};

/**
 * Toggle the modal confirm of the reporting table
 * @param {Boolean} showModal
 */
export const updateShowModal = showModal => {
  return {
    type: 'UPDATE_SHOW_MODAL',
    showModal: showModal
  };
};

/**
 * Clean info
 * @param {Boolean} showModal
 */
export const cleanInfo = () => {
  return {
    type: 'CLEAN_INFO'
  };
};
