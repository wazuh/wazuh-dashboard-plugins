import React from 'react';
import { render } from '@testing-library/react';
import WzPatternSelector from './wz-pattern-selector';
import '@testing-library/jest-dom/extend-expect';

describe('WzPatternSelector', () => {

    it('should render', () => {
        const { container } = render(<WzPatternSelector />);
        expect(container).toBeInTheDocument();
    })

})