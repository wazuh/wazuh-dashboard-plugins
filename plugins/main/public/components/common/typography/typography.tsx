import React from 'react';
import { EuiTitle, EuiTitleSize } from '@elastic/eui';

export type TypographyLevel = 'page' | 'section' | 'card' | 'metric' | 'prompt';

const TYPOGRAPHY_SCALE: Record<
  TypographyLevel,
  {
    size: EuiTitleSize;
    element: keyof JSX.IntrinsicElements;
    style?: React.CSSProperties;
  }
> = {
  page: { size: 'xl', element: 'h1' },
  section: { size: 's', element: 'h2' },
  card: { size: 'xs', element: 'h3' },
  metric: { size: 'xxs', element: 'h4' },
  prompt: { size: 'xs', element: 'h4', style: { fontWeight: 'normal' } },
};

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  level: TypographyLevel;
  'data-test-subj'?: string;
  children: React.ReactNode;
}

export const Typography = ({
  level,
  'data-test-subj': dataTestSubj = 'typography',
  children,
  className,
  ...rest
}: TypographyProps) => {
  const { size, element: Tag, style } = TYPOGRAPHY_SCALE[level];

  if (level === 'prompt') {
    return <Tag style={style}>{children}</Tag>;
  }

  return (
    <EuiTitle
      data-test-subj={dataTestSubj}
      size={size}
      className={className}
      {...rest}
    >
      <Tag style={style}>{children}</Tag>
    </EuiTitle>
  );
};

export const TypographySize = ({ level }: { level: TypographyLevel }) =>
  TYPOGRAPHY_SCALE[level]?.size;
