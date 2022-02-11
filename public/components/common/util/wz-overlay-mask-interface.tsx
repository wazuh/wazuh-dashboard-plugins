/*
 * Wazuh app - Simple description for each App tabs
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, {
  FunctionComponent,
  HTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';

export interface WzOverlayMaskInterface {
  /**
   * Function that applies to clicking the mask itself and not the children
   */
  onClick?: () => void;
  /**
   * ReactNode to render as this component's content
   */
  children?: ReactNode;
  /**
   * Should the mask visually sit above or below the EuiHeader (controlled by z-index)
   */
  headerZindexLocation?: 'above' | 'below';
}

export type EuiOverlayMaskProps = 
  Omit<
    Partial<Record<keyof HTMLAttributes<HTMLDivElement>, string>>,
    keyof WzOverlayMaskInterface
  > &
  WzOverlayMaskInterface;

export const WzOverlayMask: FunctionComponent<EuiOverlayMaskProps> = ({
  className,
  children,
  onClick,
  headerZindexLocation = 'above',
  ...rest
}) => {
  const overlayMaskNode = useRef<HTMLDivElement>(document.createElement('div'));
  const functionOnClick = useRef();
  const [isPortalTargetReady, setIsPortalTargetReady] = useState(false);

  useEffect(() => {
    document.body.classList.add('euiBody-hasOverlayMask');

    return () => {
      document.body.classList.remove('euiBody-hasOverlayMask');
    };
  }, []);

  useEffect(() => {
    const portalTarget = overlayMaskNode.current;
    document.body.appendChild(overlayMaskNode.current);
    setIsPortalTargetReady(true);

    return () => {
      if (portalTarget) {
        document.body.removeChild(portalTarget);
      }
    };
  }, []);

  useEffect(() => {
    if (!overlayMaskNode.current) return;
    Object.keys(rest).forEach(key => {
      if (typeof rest[key] !== 'string') {
        throw new Error(
          `Unhandled property type. EuiOverlayMask property ${key} is not a string.`
        );
      }
      overlayMaskNode.current.setAttribute(key, rest[key]!);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!overlayMaskNode.current) return;
    overlayMaskNode.current.className = classNames(
      'euiOverlayMask',
      `euiOverlayMask--${headerZindexLocation}Header`,
      className
    );
  }, [className, headerZindexLocation]);

  useEffect(() => {
    if (!overlayMaskNode.current || !onClick) return;
    const portalTarget = overlayMaskNode.current;
    if (functionOnClick.current) {
      portalTarget.removeEventListener('click', functionOnClick.current);
    }
    functionOnClick.current =  e => {
      if (e.target === overlayMaskNode.current) {
        onClick();
      }
    }
    overlayMaskNode.current.addEventListener('click',functionOnClick.current);

    return () => {
      if (portalTarget && onClick) {
        portalTarget.removeEventListener('click', functionOnClick.current);
      }
    };
  }, [onClick]);

  return isPortalTargetReady ? (
    <>{createPortal(children, overlayMaskNode.current!)}</>
  ) : null;
};