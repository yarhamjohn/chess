import React from 'react';
import PropTypes from 'prop-types';
import { ItemTypes } from '../shared/constants';
import { DragSource } from 'react-dnd';

const knightSource = {
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

class Knight extends React.Component {
    render() {
        const { connectDragSource, isDragging } = this.props;
        return connectDragSource(
            <span style={{
                opacity: isDragging ? 0.5 : 1, 
                cursor: 'move', 
                fontSize: 20, 
                fontWeight: 'bold'
            }}>♘</span>
        );
    }
}

Knight.propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired
}

export default DragSource(ItemTypes.KNIGHT, knightSource, collect)(Knight);
