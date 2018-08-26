import React from 'react';
import PropTypes from 'prop-types';

export default class Square extends React.Component {
    render() {
        const { colour } = this.props;

        return (
            <div style={{ backgroundColor: colour, width: '100%', height: '100%' }}>
                {this.props.children}
            </div>
        );
    }
}

Square.propTypes = {
    colour: PropTypes.string.isRequired
};