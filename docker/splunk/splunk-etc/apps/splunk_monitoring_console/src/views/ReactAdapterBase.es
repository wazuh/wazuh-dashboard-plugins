import { ThemeUtils, BaseView } from '@splunk/swc-mc';
import ReactDOM from 'react-dom';
import React from 'react';
import SplunkThemeProvider from '@splunk/themes/SplunkThemeProvider';

const ReactAdapterBaseView = BaseView.extend(
    {
        getComponent() {
            throw new Error('getComponent() not implemented');
        },
        getTheme() {
            return ThemeUtils.getCurrentTheme();
        },
        render() {
            ReactDOM.render(
                React.createElement(SplunkThemeProvider, { theme: this.getTheme() }, this.getComponent()),
                this.el,
            );
            return this;
        },
        remove() {
            ReactDOM.unmountComponentAtNode(this.el);
            return BaseView.prototype.remove.call(this);
        },
    },
    {
        wrapComponent(Component) {
            return ReactAdapterBaseView.extend({
                getComponent() {
                    return React.createElement(Component);
                },
            });
        },
    },
);

export default ReactAdapterBaseView;
