import PropTypes from 'prop-types';
import { Provider } from 'react-redux';

class BackboneProvider extends Provider {
    constructor(props, context) {
        super(props, context);
        this.model = props.model;
        this.collection = props.collection;
    }

    getChildContext() {
        return Object.assign(super.getChildContext(), {
            model: this.model,
            collection: this.collection,
        });
    }
}

BackboneProvider.propTypes = {
    store: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    children: PropTypes.element.isRequired,
    model: PropTypes.object,    // eslint-disable-line react/forbid-prop-types
    collection: PropTypes.object,   // eslint-disable-line react/forbid-prop-types
};

BackboneProvider.childContextTypes = {
    store: PropTypes.object.isRequired,
    model: PropTypes.object,
    collection: PropTypes.object,
};

export default BackboneProvider;