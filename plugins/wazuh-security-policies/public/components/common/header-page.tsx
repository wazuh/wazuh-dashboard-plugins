import React from 'react';
import { EuiPageHeader } from '@elastic/eui';

interface HeaderPageProps {
  titleHeader: React.ReactNode | string;
  descriptionHeader: React.ReactNode | string;
  rightSideItems?: React.ReactNode[];
}

export const HeaderPage = (props: HeaderPageProps) => {
  const { titleHeader, descriptionHeader, rightSideItems } = props;

  return (
    <EuiPageHeader
      pageTitle={titleHeader}
      description={descriptionHeader}
      rightSideItems={rightSideItems}
    />
  );
};
