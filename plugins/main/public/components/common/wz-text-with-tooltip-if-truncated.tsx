/*
 * Wazuh app - React component for building the management welcome screen.
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

import React, { useEffect, useRef, useState } from 'react';
import { EuiToolTip } from '@elastic/eui';
import './wz-text-with-tooltip-if-truncated.scss';

interface WzTextWithTooltipIfTruncatedProps extends React.PropsWithChildren {
  tooltip?: string;
  contentStyle?: React.CSSProperties;
  tooltipProps?: object;
}

const WzTextWithTooltipIfTruncated = (
  props: WzTextWithTooltipIfTruncatedProps,
) => {
  const { contentStyle = {}, tooltip, tooltipProps, children } = props;
  const [withTooltip, setWithTooltip] = useState(false);
  const contentReference = useRef<HTMLElement>(null);

  /**
   * The function `createClone` creates a clone of an HTML element with specific
   * styling properties.
   * @param {HTMLElement} reference - The `reference` parameter in the `createClone`
   * function is an HTMLElement that serves as the reference element from which a
   * clone will be created.
   * @returns The function `createClone` returns a clone of the provided
   * `HTMLElement` reference with specific styles applied.
   */
  const createClone = (reference: HTMLElement) => {
    // HTML element clone of reference
    const clone = reference.cloneNode(true) as HTMLElement;
    clone.style.display = 'inline';
    clone.style.width = 'auto';
    clone.style.visibility = 'hidden';
    clone.style.maxWidth = 'none';
    return clone;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const reference = contentReference.current as HTMLElement;
      const clone = createClone(reference);
      document.body.appendChild(clone);
      setWithTooltip(reference.offsetWidth < clone.offsetWidth);
      clone.remove();
    });

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [children]);

  const renderContent = () => {
    return (
      <span
        ref={contentReference}
        className='wz-text-content'
        style={contentStyle}
      >
        {children || tooltip}
      </span>
    );
  };

  return withTooltip ? (
    <EuiToolTip
      content={tooltip || children}
      {...tooltipProps}
      anchorClassName='wz-width-100'
    >
      {renderContent()}
    </EuiToolTip>
  ) : (
    renderContent()
  );
};

export default React.memo(WzTextWithTooltipIfTruncated);
