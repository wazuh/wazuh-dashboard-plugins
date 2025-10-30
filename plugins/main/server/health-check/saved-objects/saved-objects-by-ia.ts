/*
 * Wazuh app - Health check task for creating saved objects (visualizations and dashboards)
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 */

// NOTE: This module creates saved objects for a subset of the dashboards currently rendered
// "by value" in the UI. The goal is to provision equivalent "by reference" objects on the
// server, so the UI can later switch to use saved object references seamlessly.
//
// Whenever possible, custom IDs are used for predictable identification.

import type { SavedObjectsClientContract } from 'opensearch_dashboards/server';
import type { InitializationTaskRunContext } from '../services';
import type { SavedVis } from "../../../common/saved-vis/types-new";

// ---------- Builders (server-side copies) ----------
// These mirror a subset of the by-value definitions under `public/`.

function createSearchSource(indexPatternId: string, opts?: { filter?: any[] }) {
  return {
    query: { language: 'kuery', query: '' },
    filter: opts?.filter ?? [],
    index: indexPatternId,
  };
}

function createIndexPatternReferences(indexPatternId: string) {
  return [
    {
      name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
      type: 'index-pattern',
      id: indexPatternId,
    },
  ];
}

// Welcome dashboard: single panel (Events count evolution)
function getVisStateWelcomeEventsCountEvolution(indexPatternId: string): SavedVis {
  return {
    id: 'App-Agents-Welcome-Events-Evolution',
    title: 'Events count evolution',
    type: 'line',
    params: {
      type: 'line',
      grid: { categoryLines: false },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: { type: 'linear' },
          labels: { show: true, filter: true, truncate: 100 },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'left',
          show: true,
          style: {},
          scale: { type: 'linear', mode: 'normal' },
          labels: { show: true, rotate: 0, filter: false, truncate: 100 },
          title: { text: 'Count' },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'line',
          mode: 'normal',
          data: { label: 'Count', id: '1' },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          interpolate: 'linear',
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: false,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: {},
      thresholdLine: { show: false, value: 10, width: 1, style: 'full', color: '#E7664C' },
      dimensions: {
        x: null,
        y: [
          {
            accessor: 0,
            format: { id: 'number' },
            params: {},
            label: 'Count',
            aggType: 'count',
          },
        ],
      },
    },
    uiState: { vis: { params: { sort: { columnIndex: 2, direction: 'desc' } } } },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          schema: 'segment',
          params: {
            field: 'timestamp',
            useNormalizedEsInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
          },
        },
      ],
    },
  };
}

// Docker dashboard: 4 panels (Top images, Top events, Events by source over time, Events table)
function getDockerPanelsSavedVis(indexPatternId: string): Record<string, SavedVis> {
  const visTop5Images: SavedVis = {
    id: 'Wazuh-App-Overview-Docker-top-5-images',
    title: 'Top 5 images',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: { show: false, values: true, last_level: true, truncate: 100 },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        { id: '1', enabled: true, type: 'count', schema: 'metric', params: {} },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          schema: 'segment',
          params: {
            field: 'data.docker.Actor.Attributes.image',
            size: 5,
            order: 'desc',
            orderBy: '1',
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
      ],
    },
  };

  const visTop5Events: SavedVis = {
    id: 'Wazuh-App-Overview-Docker-top-5-events',
    title: 'Top 5 events',
    type: 'pie',
    params: {
      type: 'pie',
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      isDonut: true,
      labels: { show: false, values: true, last_level: true, truncate: 100 },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        { id: '1', enabled: true, type: 'count', params: {}, schema: 'metric' },
        {
          id: '2',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.docker.Action',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'segment',
        },
      ],
    },
  };

  const visEventsSourceOverTime: SavedVis = {
    id: 'Wazuh-App-Overview-Docker-Events-By-Source-Over-Time',
    title: 'Events by source over time',
    type: 'histogram',
    params: {
      type: 'histogram',
      grid: { categoryLines: false },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category',
          position: 'bottom',
          show: true,
          style: {},
          scale: { type: 'linear' },
          labels: { show: true, filter: true, truncate: 100 },
          title: {},
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: 'left',
          show: true,
          style: {},
          scale: { type: 'linear', mode: 'normal' },
          labels: { show: true, rotate: 0, filter: false, truncate: 100 },
          title: { text: 'Count' },
        },
      ],
      seriesParams: [
        {
          show: true,
          type: 'histogram',
          mode: 'stacked',
          data: { label: 'Count', id: '1' },
          valueAxis: 'ValueAxis-1',
          drawLinesBetweenPoints: true,
          lineWidth: 2,
          showCircles: true,
        },
      ],
      addTooltip: true,
      addLegend: true,
      legendPosition: 'right',
      times: [],
      addTimeMarker: false,
      labels: { show: false },
      thresholdLine: { show: false, value: 10, width: 1, style: 'full', color: '#E7664C' },
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        { id: '1', enabled: true, type: 'count', params: {}, schema: 'metric' },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          params: {
            field: 'data.docker.Type',
            orderBy: '1',
            order: 'desc',
            size: 5,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
          schema: 'group',
        },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          params: {
            field: 'timestamp',
            useNormalizedOpenSearchInterval: true,
            scaleMetricValues: false,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
          },
          schema: 'segment',
        },
      ],
    },
  };

  const visEventsTable: SavedVis = {
    id: 'Wazuh-App-Overview-Docker-Events',
    title: 'Events',
    type: 'table',
    params: {
      perPage: 10,
      showPartialRows: false,
      showMetricsAtAllLevels: false,
      showTotal: false,
      totalFunc: 'sum',
      percentageCol: '',
    },
    data: {
      searchSource: createSearchSource(indexPatternId),
      references: createIndexPatternReferences(indexPatternId),
      aggs: [
        { id: '1', enabled: true, type: 'count', params: {}, schema: 'metric' },
        {
          id: '2',
          enabled: true,
          type: 'date_histogram',
          params: {
            field: 'timestamp',
            useNormalizedOpenSearchInterval: true,
            interval: 'auto',
            drop_partials: false,
            min_doc_count: 1,
            extended_bounds: {},
          },
          schema: 'segment',
        },
        {
          id: '3',
          enabled: true,
          type: 'terms',
          schema: 'group',
          params: {
            field: 'data.docker.Actor.Attributes.image',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
        {
          id: '4',
          enabled: true,
          type: 'terms',
          schema: 'group',
          params: {
            field: 'data.docker.Action',
            orderBy: '1',
            order: 'desc',
            size: 10,
            otherBucket: false,
            otherBucketLabel: 'Other',
            missingBucket: false,
            missingBucketLabel: 'Missing',
          },
        },
      ],
    },
  };

  return { g1: visTop5Images, g2: visTop5Events, g3: visEventsSourceOverTime, g4: visEventsTable };
}

// ---------- Transform helpers ----------

function toVisualizationAttributes(savedVis: SavedVis) {
  // Kibana/OSD visualization SO expects `visState` with `aggs`, and the search source under `kibanaSavedObjectMeta`.
  const visState = {
    title: savedVis.title,
    type: savedVis.type,
    params: savedVis.params ?? {},
    aggs: savedVis.data?.aggs ?? [],
  };

  const attributes = {
    title: savedVis.title,
    visState: JSON.stringify(visState),
    uiStateJSON: JSON.stringify(savedVis.uiState ?? {}),
    description: '',
    version: 1,
    kibanaSavedObjectMeta: {
      searchSourceJSON: JSON.stringify(savedVis.data?.searchSource ?? {}),
    },
  };

  const references = savedVis.data?.references ?? [];

  return { attributes, references };
}

async function createOrUpdateVisualization(
  client: SavedObjectsClientContract,
  savedVis: SavedVis,
  logger: InitializationTaskRunContext['logger'],
) {
  const id = savedVis.id;
  const { attributes, references } = toVisualizationAttributes(savedVis);

  logger.debug(`Creating/updating visualization [${id}]`);

  const res = await client.create('visualization', attributes, {
    id,
    overwrite: true,
    refresh: true,
    references,
  });

  logger.info(`Visualization ensured [${res.id}] title [${res.attributes.title}]`);
  return res.id;
}

function buildDashboardPanelsJSON(
  order: Array<{ panelId: string; gridData: { w: number; h: number; x: number; y: number; i: string } }>,
) {
  // Use reference-based panels to avoid embedding saved object ids directly.
  return order.map((panel, idx) => ({
    gridData: panel.gridData,
    version: '7.10.0',
    type: 'visualization',
    panelRefName: `panel_${idx}`,
    embeddableConfig: {},
  }));
}

async function createOrUpdateDashboard(
  client: SavedObjectsClientContract,
  params: {
    id: string;
    title: string;
    description?: string;
    panelsOrder: Array<{ panelId: string; gridData: { w: number; h: number; x: number; y: number; i: string } }>;
    panelIdToVisualizationId: Record<string, string>;
  },
  logger: InitializationTaskRunContext['logger'],
) {
  const { id, title, description = '', panelsOrder, panelIdToVisualizationId } = params;

  const panels = buildDashboardPanelsJSON(panelsOrder);

  const references = panelsOrder.map((_, idx) => ({
    name: `panel_${idx}`,
    type: 'visualization',
    id: panelIdToVisualizationId[panelsOrder[idx].panelId],
  }));

  const attributes = {
    title,
    description,
    panelsJSON: JSON.stringify(panels),
    optionsJSON: JSON.stringify({ useMargins: true, hidePanelTitles: false }),
    timeRestore: false,
    kibanaSavedObjectMeta: {
      searchSourceJSON: JSON.stringify({ query: { language: 'kuery', query: '' }, filter: [] }),
    },
  };

  logger.debug(`Creating/updating dashboard [${id}]`);
  const res = await client.create('dashboard', attributes, {
    id,
    overwrite: true,
    refresh: true,
    references,
  });
  logger.info(`Dashboard ensured [${res.id}] title [${res.attributes.title}]`);
  return res.id;
}

// ---------- Health check task creators ----------

export const initializationTaskCreatorSavedObjects = ({
  services,
}: {
  services: any;
}) => ({
  name: 'saved-objects:dashboards',
  async run(ctx: InitializationTaskRunContext) {
    try {
      ctx.logger.debug('Starting saved objects provisioning');

      const savedObjectsClient: SavedObjectsClientContract =
        ctx.services.core.savedObjects.createInternalRepository();

      // Resolve the alerts index pattern ID from configuration (same key used for index pattern HC)
      const alertsIndexPatternId: string | undefined =
        await services.configuration.get('pattern');

      if (!alertsIndexPatternId) {
        throw new Error('Alerts index pattern ID is not configured');
      }

      // 1) Welcome dashboard (single panel)
      const welcomeVis =
        getVisStateWelcomeEventsCountEvolution(alertsIndexPatternId);
      const welcomeVisId = await createOrUpdateVisualization(
        savedObjectsClient,
        welcomeVis,
        ctx.logger,
      );

      await createOrUpdateDashboard(
        savedObjectsClient,
        {
          id: 'wazuh-dashboard-welcome',
          title: 'Welcome',
          description: 'Events count evolution',
          panelsOrder: [
            {
              panelId: '1',
              gridData: { w: 48, h: 7, x: 0, y: 0, i: '1' },
            },
          ],
          panelIdToVisualizationId: { '1': welcomeVisId },
        },
        ctx.logger,
      );

      // 2) Docker dashboard (4 panels) — created only if the index pattern exists
      // Reuse the alerts index pattern as the docker dashboard works over alerts data.
      const dockerSavedVis = getDockerPanelsSavedVis(alertsIndexPatternId);

      const dockerPanelVisIds: Record<string, string> = {};
      for (const [panelId, vis] of Object.entries(dockerSavedVis)) {
        const visId = await createOrUpdateVisualization(
          savedObjectsClient,
          vis,
          ctx.logger,
        );
        dockerPanelVisIds[panelId] = visId;
      }

      await createOrUpdateDashboard(
        savedObjectsClient,
        {
          id: 'wazuh-dashboard-docker',
          title: 'Docker',
          description: 'Docker overview dashboards',
          panelsOrder: [
            { panelId: 'g1', gridData: { w: 16, h: 10, x: 0, y: 0, i: 'g1' } },
            { panelId: 'g2', gridData: { w: 16, h: 10, x: 16, y: 0, i: 'g2' } },
            { panelId: 'g3', gridData: { w: 16, h: 10, x: 32, y: 0, i: 'g3' } },
            { panelId: 'g4', gridData: { w: 48, h: 18, x: 0, y: 10, i: 'g4' } },
          ],
          panelIdToVisualizationId: dockerPanelVisIds,
        },
        ctx.logger,
      );

      ctx.logger.debug('Saved objects provisioning finished');
      return {
        dashboards: ['wazuh-dashboard-welcome', 'wazuh-dashboard-docker'],
      };
    } catch (error) {
      const message = `Error provisioning saved objects: ${
        error instanceof Error ? error.message : String(error)
      }`;
      ctx.logger.error(message);
      throw new Error(message);
    }
  },
});

