import React from 'react';
import PropTypes from 'prop-types';
import { DragSource } from 'react-dnd';

const pieceSource = {
    beginDrag(props) {
        return {};
    }
};

function collect(connect, monitor) {
    return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging()
    }
}

function getPieceType(props) {
    return props.type;
}

class Piece extends React.Component {
    render() {
        const { connectDragSource, isDragging } = this.props;
        return connectDragSource(
            <span style={{
                opacity: isDragging ? 0.5 : 1, 
                cursor: 'move', 
                fontSize: 20, 
                fontWeight: 'bold'
            }}>
                {this.props.children}
            </span>
        );
    }
}

Piece.propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired,
    type: PropTypes.string.isRequired
}

export default DragSource(getPieceType, pieceSource, collect)(Piece);
