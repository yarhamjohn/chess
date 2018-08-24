import React from 'react';
import PropTypes from 'prop-types';

export default class Square extends React.Component {
    render() {
        const { black } = this.props;
        const fillColor = black ? 'black' : 'white';
        const iconColor = black ? 'white' : 'black';

        return (
            <div style={{ backgroundColor: fillColor, color: iconColor, height: 25, width: 25 }}>
                {this.props.children}
            </div>
        );
    }
}

Square.propTypes = {
    black: PropTypes.bool
};