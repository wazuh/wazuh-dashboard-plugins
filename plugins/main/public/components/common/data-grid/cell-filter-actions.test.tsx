import { fireEvent, render, screen } from '@testing-library/react';
import {
  cellFilterActions,
  filterIsAction,
  filterIsNotAction,
} from './cell-filter-actions';
import { EuiButtonEmpty } from '@elastic/eui';

const indexPattern = {
  flattenHit: jest.fn().mockImplementation(() => ({})),
};

const onFilter = jest.fn();

const TEST_COLUMN_ID = 'test';

describe('cell-filter-actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cellFilterActions', () => {
    it('should be undefined', () => {
      // @ts-expect-error Expected 4 arguments, but got 1.
      expect(cellFilterActions({ filterable: false })).toBeUndefined();
    });
  });

  describe('filterIsAction', () => {
    it('should call on filter with column id and value', () => {
      const TEST_VALUE = 'test-value';
      const ROW = 'row';

      indexPattern.flattenHit.mockImplementation(() => ({
        [TEST_COLUMN_ID]: TEST_VALUE,
      }));
      const rows = [ROW];
      const pageSize = 15;

      render(
        filterIsAction(
          // @ts-expect-error Argument of type '{ flattenHit: jest.Mock<any, any>; }' is not assignable to parameter of type 'IndexPattern'
          indexPattern,
          rows,
          pageSize,
          onFilter,
        )({
          rowIndex: 0,
          columnId: TEST_COLUMN_ID,
          Component: EuiButtonEmpty,
          isExpanded: false,
          closePopover: () => {},
        }),
      );

      let component = screen.getByText('Filter for value');
      expect(component).toBeTruthy();
      component = screen.getByLabelText(`Filter for value: ${TEST_COLUMN_ID}`);
      expect(component).toBeTruthy();

      fireEvent.click(component);

      expect(onFilter).toHaveBeenCalledTimes(1);
      expect(onFilter).toHaveBeenCalledWith(TEST_COLUMN_ID, 'is', TEST_VALUE);
    });
  });

  describe('filterIsNotAction', () => {
    it('should call on filter with column id and value', () => {
      const TEST_VALUE = 'test-value';
      const ROW = 'row';

      indexPattern.flattenHit.mockImplementation(() => ({
        [TEST_COLUMN_ID]: TEST_VALUE,
      }));
      const rows = [ROW];
      const pageSize = 15;

      render(
        filterIsNotAction(
          // @ts-expect-error Argument of type '{ flattenHit: jest.Mock<any, any>; }' is not assignable to parameter of type 'IndexPattern'
          indexPattern,
          rows,
          pageSize,
          onFilter,
        )({
          rowIndex: 0,
          columnId: TEST_COLUMN_ID,
          Component: EuiButtonEmpty,
          isExpanded: false,
          closePopover: () => {},
        }),
      );

      let component = screen.getByText('Filter out value');
      expect(component).toBeTruthy();
      component = screen.getByLabelText(`Filter out value: ${TEST_COLUMN_ID}`);
      expect(component).toBeTruthy();

      fireEvent.click(component);

      expect(onFilter).toHaveBeenCalledTimes(1);
      expect(onFilter).toHaveBeenCalledWith(
        TEST_COLUMN_ID,
        'is not',
        TEST_VALUE,
      );
    });
  });
});
