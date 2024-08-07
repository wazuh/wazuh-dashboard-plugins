import React from 'react';
import { withGuardAsync } from './with-guard';

export const withDataSourceFetch = withGuardAsync(
  ({ data }) => {
    if (typeof data === 'string') {
      return {
        // TODO: fetch data and return
        ok: true,
        data: {},
      };
    }
    return {
      ok: false,
      data: { data },
    };
  },
  () => <></>,
  () => <></>,
);
