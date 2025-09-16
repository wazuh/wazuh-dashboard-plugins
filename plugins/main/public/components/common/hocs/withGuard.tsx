/*
 * Wazuh app - React HOC to render a component depending of if it fulfills a condition or the wrapped component instead
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useEffect, useState } from 'react';

export const withGuard =
  (condition: (props: any) => boolean, ComponentFulfillsCondition: React.FC) =>
  (WrappedComponent: React.FC) =>
  (props: any) => {
    return condition(props) ? (
      <ComponentFulfillsCondition {...props} />
    ) : (
      <WrappedComponent {...props} />
    );
  };

export const withGuardAsync =
  (
    condition: (props: any) => Promise<{ ok: boolean; data: any }>,
    ComponentFulfillsCondition: React.FC,
    ComponentLoadingResolution: null | React.FC = null,
  ) =>
  (WrappedComponent: React.FC) =>
  (props: any) => {
    const [loading, setLoading] = useState(true);
    const [fulfillsCondition, setFulfillsCondition] = useState({
      ok: false,
      data: {},
    });

    const execCondition = async () => {
      try {
        setLoading(true);
        setFulfillsCondition({ ok: false, data: {} });
        setFulfillsCondition(
          await condition({ ...props, check: execCondition }),
        );
      } catch (error) {
        setFulfillsCondition({ ok: false, data: { error } });
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      execCondition();
    }, []);

    if (loading) {
      return ComponentLoadingResolution ? (
        <ComponentLoadingResolution {...props} />
      ) : null;
    }

    return fulfillsCondition.ok ? (
      <ComponentFulfillsCondition
        {...props}
        {...(fulfillsCondition?.data ?? {})}
        check={execCondition}
      />
    ) : (
      <WrappedComponent
        {...props}
        {...(fulfillsCondition?.data ?? {})}
        check={execCondition}
      />
    );
  };
