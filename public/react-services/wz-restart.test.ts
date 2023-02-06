/*
 * Wazuh app - React test for wz-restart
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ENUM_RESTART_STATES } from './interfaces/wz-restart.interface';
import { RestartHandler } from './wz-restart';
import { WzRequest } from './wz-request';

import { useSelector } from 'react-redux';
import {
  updateUnsynchronizedNodes,
  updateSyncNodesInfo,
  updateRestartNodesInfo,
  updateRestartStatus
} from '../redux/actions/restartActions';
import restartWazuhReducer from '../redux/reducers/restartReducers';



const mockedResponseClusterStatus = {
  data: {
    data: {
      enabled: 'yes',
      running: 'yes',
    },
    error: 0,
  },
};

const mockResponseConfValidation = {
  data: {
    data: {
      affected_items: [
        {
          name: "master-node",
          status: "OK"
        },
        {
          name: "worker1",
          status: "OK"
        },
        {
          name: "worker2",
          status: "OK"
        }
      ],
      total_affected_items: 3,
      total_failed_items: 0,
      failed_items: []
    },
    message: "Validation was successfully checked in all nodes",
    error: 0
  }
}

const mockResponseRestartCluster = {
  data: {
    data: {
      affected_items: [
        "master-node",
        "worker1",
        "worker2"
      ],
      total_affected_items: 3,
      total_failed_items: 0,
      failed_items: []
    },
    message: "Restart request sent to  all specified nodes",
    error: 0
  }
}

const mockResponseClusterNodes = {
  data: {
    data: {
      affected_items: [
        {
          name: "master-node",
          type: "master",
          version: "4.3.0",
          ip: "wazuh-master",
          connection_date: "2020-05-27T10:50:49.175Z"
        },
        {
          name: "worker1",
          type: "worker",
          version: "4.3.0",
          ip: "172.26.0.7",
          connection_date: "2020-05-27T10:50:49.175Z"
        },
        {
          name: "worker2",
          type: "worker",
          version: "4.3.0",
          ip: "172.26.0.6",
          connection_date: "2020-05-27T10:50:49.175Z"
        }
      ],
      total_affected_items: 3,
      total_failed_items: 0,
      failed_items: []
    },
    message: "All selected nodes information was returned",
    error: 0
  }
}

describe('Wazuh Restart Service', () => {
  beforeEach(() => jest.clearAllMocks());
  describe('isCluster()', () => {
    it('Should return true if the cluster is running', async () => {
      WzRequest.apiReq = jest.fn().mockResolvedValue(mockedResponseClusterStatus)

      const result = await RestartHandler.clusterReq();
      expect(result).toEqual(true);
    });
  });

  describe('restartWazuh()', () => {
    it('Should read ', async () => {

      WzRequest.apiReq = jest
        .fn()
        .mockResolvedValueOnce(mockedResponseClusterStatus)
        .mockResolvedValueOnce(mockResponseConfValidation)
        .mockResolvedValueOnce(mockResponseRestartCluster)
        .mockResolvedValueOnce(mockResponseClusterNodes)
      // Restart

      const result = await RestartHandler.restartWazuh({
        updateUnsynchronizedNodes,
        updateSyncNodesInfo,
        updateRestartNodesInfo,
        updateRestartStatus
      });

      expect(result).toEqual(ENUM_RESTART_STATES.RESTARTED);
    });
  });
});
