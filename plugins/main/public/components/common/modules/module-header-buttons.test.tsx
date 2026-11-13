import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModuleHeaderButtons } from './module-header-buttons';

const layout = { headerRight: 1400, buttonsRight: 1300 };

const rect = (right: number) => ({ right, width: right } as DOMRect);

const GenerateReport = () => <button>Generate report</button>;
const ExploreAgent = () => <button>Explore agent</button>;

const renderHeader = () =>
  render(
    <div className='wz-welcome-page-agent-tabs'>
      <ModuleHeaderButtons
        buttons={[ExploreAgent, GenerateReport]}
        buttonProps={{}}
      />
    </div>,
  );

const getMoreActions = () =>
  document.querySelector('[data-test-subj="wzModuleHeaderMoreActions"]');

let notifyResize: () => void;

class MockResizeObserver {
  constructor(callback: () => void) {
    notifyResize = callback;
  }
  observe() {}
  disconnect() {}
}

const resizeHeader = (headerRight: number) =>
  act(() => {
    layout.headerRight = headerRight;
    notifyResize();
  });

describe('ModuleHeaderButtons', () => {
  beforeEach(() => {
    window.ResizeObserver =
      MockResizeObserver as unknown as typeof ResizeObserver;
    Object.assign(layout, {
      headerRight: 1400,
      buttonsRight: 1300,
    });
    jest
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: Element) {
        if (this.classList.contains('wz-welcome-page-agent-tabs')) {
          return rect(layout.headerRight);
        }
        return rect(layout.buttonsRight);
      });
  });

  afterEach(() => jest.restoreAllMocks());

  it('shows the buttons in a row when they fit', () => {
    renderHeader();

    expect(screen.getByText('Generate report')).toBeInTheDocument();
    expect(getMoreActions()).not.toBeInTheDocument();
  });

  it('folds the buttons into a menu when they pass the header edge', () => {
    layout.headerRight = 1100;
    renderHeader();

    expect(screen.queryByText('Generate report')).not.toBeInTheDocument();

    fireEvent.click(getMoreActions() as Element);

    expect(screen.getByText('Generate report')).toBeInTheDocument();
    expect(screen.getByText('Explore agent')).toBeInTheDocument();
  });

  it('shows the row again once the space they need is free', () => {
    layout.headerRight = 1100;
    renderHeader();
    expect(getMoreActions()).toBeInTheDocument();

    resizeHeader(1250);
    expect(getMoreActions()).toBeInTheDocument();

    resizeHeader(1400);
    expect(getMoreActions()).not.toBeInTheDocument();
    expect(screen.getByText('Generate report')).toBeInTheDocument();
  });
});
