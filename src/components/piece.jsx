import React from 'react';
import PropTypes from 'prop-types';
import { DragSource } from 'react-dnd';

const pieceSource = {
    beginDrag(props) {
        return { id: props.id };
    }
};

function collect(connect, monitor) {
    return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging()
    };
}

function getDragSourceType(props) {
    return props.type;
}

class Piece extends React.Component {
    render() {
        const { connectDragSource, isDragging, icon } = this.props;
        return connectDragSource(
            <span style={{
                opacity: isDragging ? 0.5 : 1,
                cursor: 'move',
                fontSize: 20,
                fontWeight: 'bold'
                }}
            >
                { icon }
            </span>
        );
    }
}

Piece.propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired,
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired
}

export default DragSource(getDragSourceType, pieceSource, collect)(Piece);
