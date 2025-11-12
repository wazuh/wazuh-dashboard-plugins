import React from 'react';
import { EuiTitle, EuiTitleSize } from '@elastic/eui';

export type TypographyLevel = 'page' | 'section' | 'card' | 'metric';

const TYPOGRAPHY_SCALE: Record<
  TypographyLevel,
  { size: EuiTitleSize; element: keyof JSX.IntrinsicElements }
> = {
  page: { size: 'xl', element: 'h1' },
  section: { size: 's', element: 'h2' },
  card: { size: 'xs', element: 'h3' },
  metric: { size: 'xxs', element: 'h4' },
};

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  level?: TypographyLevel;
  element?: keyof JSX.IntrinsicElements;
  'data-test-subj'?: string;
  children: React.ReactNode;
}

export const Typography = ({
  level = 'section',
  element,
  children,
  className,
  ...rest
}: TypographyProps) => {
  const { size, element: defaultElement } = TYPOGRAPHY_SCALE[level];
  const Tag = (element || defaultElement) as keyof JSX.IntrinsicElements;

  return (
    <EuiTitle size={size} className={className} {...rest}>
      <Tag>{children}</Tag>
    </EuiTitle>
  );
};
