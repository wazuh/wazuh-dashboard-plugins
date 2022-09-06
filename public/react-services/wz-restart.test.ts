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

import { reduxDispatchers } from '../components/common/restart-modal/restart-modal';
import { useSelector } from 'react-redux';

describe('Wazuh Restart Service', () => {
  describe('isCluster()', () => {
    it('Should return true if the cluster is running', () => {
      const result = RestartHandler.clusterReq();
      expect(result).toEqual(true);
    });
  });

  describe('restartWazuh()', () => {
    it('Should read ', async () => {
      // Import redux update functions
      const { updateRedux } = reduxDispatchers();

      // Restart
      await RestartHandler.restartWazuh(updateRedux);

      // Read restart status
      const restartStatus = useSelector((state) => state.restartWazuhReducers.restartStatus);

      // Compare current status and expected status
      expect(restartStatus).toEqual(ENUM_RESTART_STATES.RESTARTED_INFO);
    });
  });
});
