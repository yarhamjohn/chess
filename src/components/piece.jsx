import React from 'react';
import PropTypes from 'prop-types';
import { DragSource } from 'react-dnd';

const pieceSource = {
    beginDrag(props) {
        return {id: props.id};
    }
};

function collect(connect, monitor) {
    return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging()
    }
}

function getDragSourceType(props) {
    return props.piece.type;
}

class Piece extends React.Component {
    render() {
        const { connectDragSource, isDragging, piece } = this.props;
        return connectDragSource(
            <span style={{
                opacity: isDragging ? 0.5 : 1, 
                cursor: 'move', 
                fontSize: 20, 
                fontWeight: 'bold'
            }}>
                {piece.icon}
            </span>
        );
    }
}

Piece.propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired,
    id: PropTypes.string.isRequired,
    piece: PropTypes.shape({
        type: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        colour: PropTypes.string.isRequired,
        startingPositions: PropTypes.arrayOf(
            PropTypes.arrayOf(
                PropTypes.number
            )
        )
    }).isRequired
}

export default DragSource(getDragSourceType, pieceSource, collect)(Piece);
