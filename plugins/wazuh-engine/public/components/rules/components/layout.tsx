import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiHorizontalRule,
} from '@elastic/eui';

export const Layout = ({
  title,
  children,
  actions,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  actions?: any;
}) => {
  return (
    <>
      <EuiFlexGroup justifyContent='spaceBetween' alignItems='center'>
        <EuiFlexItem>
          <EuiTitle>
            <h1>{title}</h1>
          </EuiTitle>
        </EuiFlexItem>
        {actions && (
          <EuiFlexItem grow={false}>
            <ViewActions actions={actions} />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      <EuiHorizontalRule margin='xs' />
      <div>{children}</div>
    </>
  );
};

const ViewActions = ({ actions }) => {
  return Array.isArray(actions) ? (
    <EuiFlexGroup alignItems='center'>
      {actions.map(action => (
        <EuiFlexItem grow={false}>{action}</EuiFlexItem>
      ))}
    </EuiFlexGroup>
  ) : (
    actions()
  );
};
