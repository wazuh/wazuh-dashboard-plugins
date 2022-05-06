/*
 * Wazuh app - Module for Kibana template
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const pluginPlatformTemplate = {
  order: 0,
  template: '.kibana*',
  settings: {
    'index.refresh_interval': '5s'
  },
  mappings: {
    properties: {
      type: {
        type: 'keyword'
      },
      updated_at: {
        type: 'date'
      },
      config: {
        properties: {
          buildNum: {
            type: 'keyword'
          }
        }
      },
      'index-pattern': {
        properties: {
          fieldFormatMap: {
            type: 'text'
          },
          fields: {
            type: 'text'
          },
          intervalName: {
            type: 'keyword'
          },
          notExpandable: {
            type: 'boolean'
          },
          sourceFilters: {
            type: 'text'
          },
          timeFieldName: {
            type: 'keyword'
          },
          title: {
            type: 'text'
          }
        }
      },
      visualization: {
        properties: {
          description: {
            type: 'text'
          },
          kibanaSavedObjectMeta: {
            properties: {
              searchSourceJSON: {
                type: 'text'
              }
            }
          },
          savedSearchId: {
            type: 'keyword'
          },
          title: {
            type: 'text'
          },
          uiStateJSON: {
            type: 'text'
          },
          version: {
            type: 'integer'
          },
          visState: {
            type: 'text'
          }
        }
      },
      search: {
        properties: {
          columns: {
            type: 'keyword'
          },
          description: {
            type: 'text'
          },
          hits: {
            type: 'integer'
          },
          kibanaSavedObjectMeta: {
            properties: {
              searchSourceJSON: {
                type: 'text'
              }
            }
          },
          sort: {
            type: 'keyword'
          },
          title: {
            type: 'text'
          },
          version: {
            type: 'integer'
          }
        }
      },
      dashboard: {
        properties: {
          description: {
            type: 'text'
          },
          hits: {
            type: 'integer'
          },
          kibanaSavedObjectMeta: {
            properties: {
              searchSourceJSON: {
                type: 'text'
              }
            }
          },
          optionsJSON: {
            type: 'text'
          },
          panelsJSON: {
            type: 'text'
          },
          refreshInterval: {
            properties: {
              display: {
                type: 'keyword'
              },
              pause: {
                type: 'boolean'
              },
              section: {
                type: 'integer'
              },
              value: {
                type: 'integer'
              }
            }
          },
          timeFrom: {
            type: 'keyword'
          },
          timeRestore: {
            type: 'boolean'
          },
          timeTo: {
            type: 'keyword'
          },
          title: {
            type: 'text'
          },
          uiStateJSON: {
            type: 'text'
          },
          version: {
            type: 'integer'
          }
        }
      },
      url: {
        properties: {
          accessCount: {
            type: 'long'
          },
          accessDate: {
            type: 'date'
          },
          createDate: {
            type: 'date'
          },
          url: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 2048
              }
            }
          }
        }
      },
      server: {
        properties: {
          uuid: {
            type: 'keyword'
          }
        }
      },
      'timelion-sheet': {
        properties: {
          description: {
            type: 'text'
          },
          hits: {
            type: 'integer'
          },
          kibanaSavedObjectMeta: {
            properties: {
              searchSourceJSON: {
                type: 'text'
              }
            }
          },
          timelion_chart_height: {
            type: 'integer'
          },
          timelion_columns: {
            type: 'integer'
          },
          timelion_interval: {
            type: 'keyword'
          },
          timelion_other_interval: {
            type: 'keyword'
          },
          timelion_rows: {
            type: 'integer'
          },
          timelion_sheet: {
            type: 'text'
          },
          title: {
            type: 'text'
          },
          version: {
            type: 'integer'
          }
        }
      },
      'graph-workspace': {
        properties: {
          description: {
            type: 'text'
          },
          kibanaSavedObjectMeta: {
            properties: {
              searchSourceJSON: {
                type: 'text'
              }
            }
          },
          numLinks: {
            type: 'integer'
          },
          numVertices: {
            type: 'integer'
          },
          title: {
            type: 'text'
          },
          version: {
            type: 'integer'
          },
          wsState: {
            type: 'text'
          }
        }
      }
    }
  }
};
