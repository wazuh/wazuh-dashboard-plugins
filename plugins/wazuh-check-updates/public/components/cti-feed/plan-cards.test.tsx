import React from 'react';
import { configure, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlanCards } from './plan-cards';

configure({ testIdAttribute: 'data-test-subj' });

describe('PlanCards', () => {
  test('marks the Open feed as the current plan', () => {
    render(<PlanCards currentPlan='open' />);

    const open = screen.getByTestId('ctiFeedPlanCard-open');
    const professional = screen.getByTestId('ctiFeedPlanCard-professional');
    expect(open).toHaveAttribute('data-current', 'true');
    expect(within(open).getByText('Your plan')).toBeInTheDocument();
    expect(within(open).queryByText('Included')).toBeNull();
    expect(professional).toHaveAttribute('data-current', 'false');
    expect(within(professional).queryByText('Your plan')).toBeNull();
  });

  test('marks the Professional feed as the current plan, the Open one as included', () => {
    render(<PlanCards currentPlan='professional' />);

    const open = screen.getByTestId('ctiFeedPlanCard-open');
    const professional = screen.getByTestId('ctiFeedPlanCard-professional');
    expect(professional).toHaveAttribute('data-current', 'true');
    expect(within(professional).getByText('Your plan')).toBeInTheDocument();
    expect(within(open).getByText('Included')).toBeInTheDocument();
    expect(professional).toHaveTextContent(
      'New vulnerabilities, IOCs and rules, delivered faster.',
    );
    expect(open).toHaveTextContent(
      'Public rules, IOCs and vulnerabilities for every installation.',
    );
  });

  test('marks no card when the plan is unknown', () => {
    render(<PlanCards currentPlan={null} />);

    expect(screen.queryByText('Your plan')).toBeNull();
  });

  test('is read only: no links or buttons', () => {
    render(<PlanCards currentPlan='professional' />);

    const cards = screen.getByTestId('ctiFeedPlanCards');
    expect(within(cards).queryAllByRole('link')).toHaveLength(0);
    expect(within(cards).queryAllByRole('button')).toHaveLength(0);
  });
});
