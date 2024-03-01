import React from 'react';
import { render } from '@testing-library/react';
import PatternSelector from './pattern-selector';
import '@testing-library/jest-dom/extend-expect';

describe('PatternSelector', () => {

    it('should render', () => {
        const { container } = render(<PatternSelector />);
        expect(container).toBeInTheDocument();
    })

})