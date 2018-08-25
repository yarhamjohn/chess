import React from 'react';
import PropTypes from 'prop-types';
import Square from './square';
import { DropTarget } from 'react-dnd';
import { ItemTypes } from '../shared/constants';
import { canMovePiece, movePiece } from '../shared/game';

const squareTarget = {
    drop(props, monitor) {
        movePiece(props.col, props.row, props.type)
    },

    canDrop(props) {
        return canMovePiece(props.col, props.row, props.type)
    }
}

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    }
}

function getPieceType(props) {
    return props.type == null ? "" : props.type;
}

class BoardSquare extends React.Component {
    render() {
        const { row, col, connectDropTarget, isOver, canDrop } = this.props;
        const black = (col + row) % 2 === 1;

        return connectDropTarget(
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Square black={black}>
                    {this.props.children}
                </Square>
                {isOver && !canDrop && this.renderOverlay('red')}
                {!isOver && canDrop && this.renderOverlay('yellow')}
                {isOver && canDrop && this.renderOverlay('limegreen')}
            </div>
        );
    }

    renderOverlay(color) {
        return (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            zIndex: 1,
            opacity: 0.5,
            backgroundColor: color,
          }} />
        );
      }
}

Square.propTypes = {
    row: PropTypes.number,
    col: PropTypes.number,
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired,
    type: PropTypes.string
};

export default DropTarget(getPieceType, squareTarget, collect)(BoardSquare);
