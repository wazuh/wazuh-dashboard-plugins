/*
 * Wazuh app - Shared Case tab definition for the Document details flyout
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { DocumentViewTableAndJsonPropsAdditionalTabs } from '../../wazuh-discover/components/document-view-table-and-json';
import { CaseManagementTab } from './case-management-tab';

/**
 * Builds the "Case" tab for the Document details flyout.
 *
 * Shared by every surface that renders findings documents (the findings discover
 * view and the Threat Hunting Cases table) so the tab behaves identically in all of
 * them. On a successful create/edit/clean it calls `onDocumentMutated` with the new
 * case payload, which lets the host grid patch the open flyout instantly and refresh
 * the grid and its charts. See [[apply-hit-source-update]].
 */
export const caseManagementDocumentDetailsTabs: DocumentViewTableAndJsonPropsAdditionalTabs =
  ({ document, onDocumentMutated }) => [
    {
      id: 'case-management',
      name: 'Case',
      content: (
        <CaseManagementTab
          document={{ _index: document._index, _id: document._id }}
          onSaveSuccess={caseData =>
            onDocumentMutated?.({ wazuh: { case: caseData } })
          }
        />
      ),
    },
  ];
