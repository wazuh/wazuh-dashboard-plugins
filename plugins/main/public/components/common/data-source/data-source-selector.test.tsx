import React from 'react';
import { render } from '@testing-library/react';
import DataSourceSelector from './data-source-selector';
import '@testing-library/jest-dom/extend-expect';

describe('DataSourceSelector', () => {

    it('should render', () => {
        // use react testing library
        const { container } = render(<DataSourceSelector />);
        expect(container).toBeInTheDocument();
    })

})