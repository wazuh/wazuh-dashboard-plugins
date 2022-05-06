/*
 * Wazuh app - React component for building Remoted dashboard
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
import { useEffect } from "react";

import store from "../../../../../../redux/store";
import { TabVisualizations } from "../../../../../../factories/tab-visualizations";
import { LoadedVisualizations } from "../../../../../../factories/loaded-visualizations";
import { DiscoverPendingUpdates } from "../../../../../../factories/discover-pending-updates";
import { RawVisualizations } from "../../../../../../factories/raw-visualizations";
import { GenericRequest } from "../../../../../../react-services/generic-request";
import { updateVis } from "../../../../../../redux/actions/visualizationsActions";
import { AppState } from "../../../../../../react-services/app-state";
import { WazuhConfig } from '../../../../../../react-services/wazuh-config.js';

export const useBuildStatisticsVisualizations = (clusterNodeSelected, refreshVisualizations) => {
  const { 'cron.prefix': indexPrefix, 'cron.statistics.index.name': indexName } = new WazuhConfig().getConfig();
  useEffect(() => {
    const tabVisualizations = new TabVisualizations();
    const rawVisualizations = new RawVisualizations();
    const discoverPendingUpdates = new DiscoverPendingUpdates();
    const loadedVisualizations = new LoadedVisualizations();
    discoverPendingUpdates.removeAll();
    rawVisualizations.removeAll();
    tabVisualizations.removeAll();
    loadedVisualizations.removeAll();
    tabVisualizations.setTab("statistics");
    tabVisualizations.assign({
      statistics: 2,
    });
    const buildStatisticsVisualizations = async () => {
      discoverPendingUpdates.addItem({ query: "", language: "lucene" }, []);
      const patternIDTitle = `${indexPrefix}-${indexName}-*`;
      const pattern = {
        id: patternIDTitle,
        title: patternIDTitle
      };
      const visData = await GenericRequest.request(
        "POST",
        `/elastic/visualizations/cluster-statistics/${patternIDTitle}`,
        { nodes: { affected_items: [{}], master_node: JSON.parse(AppState.getCurrentAPI()).id, name: clusterNodeSelected }, pattern }
      );
      await rawVisualizations.assignItems(visData.data.raw);
      store.dispatch(
        updateVis({ update: true, raw: rawVisualizations.getList() })
      );
    };
    buildStatisticsVisualizations();
  }, [refreshVisualizations]);
}