/*
 * Wazuh app - React test for Ruleset component.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import React from 'react';
import { mount } from 'enzyme';
import { AgentStatTable } from './table';
import * as FileSaver from '../../../services/file-saver';

jest.mock('../../../services/file-saver', () => ({
  saveAs: jest.fn(),
}));
jest.mock('../../../kibana-services', () => ({
  getHttp: () => ({
    basePath: {
      prepend: str => str,
    },
  }),
  getCookies: () => {
    return {
      get: () => 'test',
    };
  },
}));
jest.mock(
  '../../../../../../node_modules/@elastic/eui/lib/services/accessibility/html_id_generator',
  () => ({
    htmlIdGenerator: () => () => 'htmlId',
  }),
);

const tableColumns = [
  {
    field: 'location',
    name: 'Location',
    sortable: true,
  },
  {
    field: 'events',
    name: 'Events',
    sortable: true,
  },
  {
    field: 'bytes',
    name: 'Bytes',
    sortable: true,
  },
];

/**
 * `new Blob([...])` cannot be read back synchronously in jsdom, so capture the
 * parts the component hands to the Blob constructor.
 */
class CapturingBlob {
  parts: string[];
  type: string | undefined;

  constructor(parts: string[], options?: { type?: string }) {
    this.parts = parts;
    this.type = options?.type;
  }
}

/** Split one CSV row into cells, honouring RFC 4180 double quoting. */
const splitCsvRow = (row: string): string[] => {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < row.length; index++) {
    const character = row[index];

    if (quoted) {
      if (character === '"') {
        if (row[index + 1] === '"') {
          cell += '"';
          index++;
        } else {
          quoted = false;
        }
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      cells.push(cell);
      cell = '';
    } else {
      cell += character;
    }
  }
  cells.push(cell);

  return cells;
};

describe('AgentStatTable component', () => {
  const originalBlob = global.Blob;

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error jsdom Blob replaced by a capturing stub
    global.Blob = CapturingBlob;
  });

  afterEach(() => {
    global.Blob = originalBlob;
  });

  it('Renders correctly to match the snapshot', () => {
    const wrapper = mount(
      <AgentStatTable
        columns={tableColumns}
        loading={false}
        start={''}
        end={''}
        title='Test'
        items={[]}
        exportCSVFilename={`agent-stats-10101-logcollector-global`}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('Should return loading in process', () => {
    const wrapper = mount(
      <AgentStatTable
        columns={tableColumns}
        loading={true}
        start={''}
        end={''}
        title='Test'
        items={[]}
        exportCSVFilename={`agent-stats-10101-logcollector-global`}
      />,
    );

    expect(wrapper.find('EuiLoadingSpinner').exists()).toBeTruthy();
    expect(wrapper.find('EuiLoadingSpinner').first().prop('size')).toBe('s');
  });

  it('Checking onClick event', () => {
    const wrapper = mount(
      <AgentStatTable
        columns={tableColumns}
        loading={true}
        start={''}
        end={''}
        title='Test'
        items={[]}
        exportCSVFilename={`agent-stats-10101-logcollector-global`}
      />,
    );

    const mockOnClick = jest.fn();
    wrapper.find('EuiButtonEmpty').props().onClick = mockOnClick;
    // @ts-ignore
    wrapper.find('EuiButtonEmpty').props().onClick();
    expect(mockOnClick).toHaveBeenCalled();
  });

  describe('CSV export', () => {
    const exportCsv = async (items: Record<string, unknown>[]) => {
      const wrapper = mount(
        <AgentStatTable
          columns={tableColumns}
          loading={false}
          start={''}
          end={''}
          title='Test'
          items={items}
          exportCSVFilename={`agent-stats-10101-logcollector-global`}
        />,
      );

      const downloadButton = wrapper
        .find('EuiButtonEmpty')
        .filterWhere(node => node.text() === 'Download CSV')
        .first();

      const onClick = downloadButton.props().onClick as () => Promise<void>;

      await onClick();

      const [blob, filename] = (FileSaver.saveAs as jest.Mock).mock.calls[0];

      return { csv: blob.parts[0] as string, filename };
    };

    it('saves the file under the exportCSVFilename prop', async () => {
      const { filename } = await exportCsv([
        { location: '/var/log/syslog', events: 5, bytes: 10 },
      ]);

      expect(filename).toBe('agent-stats-10101-logcollector-global.csv');
    });

    it('emits the header row and column order of the table columns', async () => {
      const { csv } = await exportCsv([
        { location: '/var/log/syslog', events: 5, bytes: 10 },
      ]);

      expect(csv.split('\n')[0]).toBe('Location,Events,Bytes');
      expect(csv).toBe('Location,Events,Bytes\n/var/log/syslog,5,10');
    });

    it('renders a missing field as an empty cell', async () => {
      const { csv } = await exportCsv([{ location: '/var/log/syslog' }]);

      expect(csv).toBe('Location,Events,Bytes\n/var/log/syslog,,');
    });

    it('round-trips a location containing a comma as a single cell', async () => {
      const { csv } = await exportCsv([
        { location: '/var/log/a,b.log', events: 5, bytes: 10 },
      ]);

      const [header, row] = csv.split('\n');
      const cells = splitCsvRow(row);

      expect(cells).toHaveLength(splitCsvRow(header).length);
      expect(cells[0]).toBe('/var/log/a,b.log');
      expect(csv).toBe('Location,Events,Bytes\n"/var/log/a,b.log",5,10');
    });

    it('round-trips a value containing a double quote as a single cell', async () => {
      const { csv } = await exportCsv([
        { location: 'say "hi"', events: 5, bytes: 10 },
      ]);

      const cells = splitCsvRow(csv.split('\n')[1]);

      expect(cells).toHaveLength(3);
      expect(cells[0]).toBe('say "hi"');
    });

    it('round-trips a value containing a newline as a single cell', async () => {
      const { csv } = await exportCsv([
        { location: 'line1\nline2', events: 5, bytes: 10 },
      ]);

      expect(csv).toBe('Location,Events,Bytes\n"line1\nline2",5,10');
    });

    it('neutralizes a formula-leading location', async () => {
      const { csv } = await exportCsv([
        { location: '=cmd', events: 5, bytes: 10 },
      ]);

      expect(csv).toBe("Location,Events,Bytes\n'=cmd,5,10");
    });
  });
});
