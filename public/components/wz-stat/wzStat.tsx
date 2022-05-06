/*
 * Wazuh app - React Component component to display simple data with title and description arranged in a row.
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

import React, {
  Fragment,
  HTMLAttributes,
  FunctionComponent,
  ReactNode,
} from 'react';
import {
  EuiText,
  EuiTitle,
  EuiTitleSize,
  EuiScreenReaderOnly,
} from '@elastic/eui';
import { CommonProps, keysOf } from './common';
import classNames from 'classnames';

const colorToClassNameMap = {
  default: null,
  subdued: 'euiStat__title--subdued',
  primary: 'euiStat__title--primary',
  secondary: 'euiStat__title--secondary',
  danger: 'euiStat__title--danger',
  accent: 'euiStat__title--accent',
};

export const COLORS = keysOf(colorToClassNameMap);

const textAlignToClassNameMap = {
  left: 'euiStat--leftAligned',
  center: 'euiStat--centerAligned',
  right: 'euiStat--rightAligned',
};

export const isColorClass = (
  input: string
): input is keyof typeof colorToClassNameMap => {
  return colorToClassNameMap.hasOwnProperty(input);
};

export const ALIGNMENTS = keysOf(textAlignToClassNameMap);

export interface EuiStatProps {
  /**
   * Set the description (label) text
   */
  description: ReactNode;
  /**
   * Will hide the title with an animation until false
   */
  isLoading?: boolean;
  /**
   * Flips the order of the description and title
   */
  reverse?: boolean;
  textAlign?: keyof typeof textAlignToClassNameMap;
  /**
   * The (value) text
   */
  title: ReactNode;
  /**
   * The color of the title text
   */
  titleColor?: keyof typeof colorToClassNameMap | string;
  /**
   * Size of the title. See EuiTitle for options ('s', 'm', 'l'... etc)
   */
  titleSize?: EuiTitleSize;
}

export const WzStat: FunctionComponent<
  CommonProps & Omit<HTMLAttributes<HTMLDivElement>, 'title'> & EuiStatProps> = ({
    title,
    description,
    titleSize = 'l',
    children,
    className,
    isLoading = false,
    reverse = false,
    textAlign = 'left',
    titleColor = 'default',
    ...rest
  }) => {

    const classes = classNames(
      'euiStat',
      textAlignToClassNameMap[textAlign],
      className
    );

    const titleClasses = classNames(
      'euiStat__title',
      isColorClass(titleColor) ? colorToClassNameMap[titleColor] : null,
      {
        'euiStat__title-isLoading': isLoading,
      }
    );

    const descriptionDisplay = (
      <EuiText size="s" className="euiStat__description">
        <span aria-hidden="true">{description}</span>
      </EuiText>
    );

    const titleDisplay = isColorClass(titleColor) ? (
      <EuiTitle size={titleSize} className={titleClasses}>
        <span aria-hidden="true">{isLoading ? '--' : title}</span>
      </EuiTitle>
    ) : (
      <EuiTitle size={titleSize} className={titleClasses}>
        <span aria-hidden="true" style={{ color: `${titleColor}` }}>
          {isLoading ? '--' : title}
        </span>
      </EuiTitle>
    );

    const screenReader = (
      <EuiScreenReaderOnly>
        <span>
          {isLoading ? (
            <span token="euiStat.loadingText" default="Statistic is loading" />
          ) : (
            <Fragment>
              {reverse ? `${title} ${description}` : `${description} ${title}`}
            </Fragment>
          )}
        </span>
      </EuiScreenReaderOnly>
    );

    const statDisplay = (
      <Fragment>
        {!reverse && descriptionDisplay}
        {titleDisplay}
        {reverse && descriptionDisplay}
        {screenReader}
      </Fragment>
    );

    return (
      <div className={classes} {...rest}>
        {statDisplay}
        {children}
      </div>
    );
  };