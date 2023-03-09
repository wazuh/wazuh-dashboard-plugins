import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Link from '@splunk/react-ui/Link';
import List from '@splunk/react-ui/List';
import BookmarkModal from './BookmarkModal';
import * as Utils from './Utils';
import styled from 'styled-components'
import './Bookmark.pcss';

class BookmarkPanel extends Component {
    static propTypes = {
        bookmarks: PropTypes.shape({
            fetch: PropTypes.func,
            getBookmarks: PropTypes.func,
            models: PropTypes.arrayOf(PropTypes.shape({})),
            on: PropTypes.func,
        }).isRequired,
    };

    constructor(props, context) {
        super(props, context);
        this.state = {
            bookmarks: Utils.getValidBookmarks(this.props.bookmarks.getBookmarks()),
        };
    }

    /**
     * Repopulate the bookmarks.
     */
    updateBookmarks = () => {
        this.setState({
            bookmarks: Utils.getValidBookmarks(this.props.bookmarks.getBookmarks()),
        });
    }

    /**
     * Handle the modal close.
     */
    handleModalClose = () => {
        this.updateBookmarks();
    }

    /**
     * Render bookmark panel.
     */
    render() {
        const BookmarkListItem = styled(List.Item)`
            text-align: center;
            padding: 20px 10px ;
        `
        return (
            <div className="bookmarks">
                <List>
                    {this.state.bookmarks.map(row => (
                        <List.Item key={row.id}>
                            <Link
                                data-test-name="deployment-link"
                                to={row.url}
                            >
                                {row.label}
                            </Link>
                        </List.Item>
                    ))}
                    <BookmarkListItem
                        key={-1}
                    >
                        <BookmarkModal
                            bookmarks={this.props.bookmarks}
                            handleClose={this.handleModalClose}
                        />
                    </BookmarkListItem>
                </List>
            </div>
        );
    }
}

export default BookmarkPanel;