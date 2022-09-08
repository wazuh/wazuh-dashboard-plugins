/*
 * Wazuh app - React component for main CDB List view.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useState } from 'react';
// Redux
import WzReduxProvider from '../../../../../redux/wz-redux-provider';
import WzCDBListsOverview from './views/cdblists-overview';
import WzListEditor from './views/list-editor';

export default function WzCDBList({ clusterStatus }) {
  const [listContent, setListContent] = useState(false);

  return (
    <WzReduxProvider>
      {
        (listContent && (
          <WzListEditor
            listContent={listContent}
            clusterStatus={clusterStatus}
            clearContent={() => { setListContent(false) }}
            updateListContent={(listContent) => { setListContent(listContent) }}
          />
        )) || (
          <WzCDBListsOverview
            clusterStatus={clusterStatus}
            updateListContent={(listContent) => { setListContent(listContent) }}
          />
        )
      }
    </WzReduxProvider>
  );
}
