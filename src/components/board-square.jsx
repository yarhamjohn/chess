import React from 'react';
import PropTypes from 'prop-types';
import { DropTarget } from 'react-dnd';
import Square from './square';
import Piece from './piece';
import { canMovePiece, movePiece } from '../shared/game';
import { PieceTypes } from '../shared/constants';

const squareTarget = {
    drop(props, monitor) {
        const piece = monitor.getItem();
        const newPosition = [props.col, props.row];
        movePiece(newPosition, piece.id);
    },

    canDrop(props, monitor) {
        const piece = monitor.getItem();
        const newPosition = [props.col, props.row];
        return canMovePiece(newPosition, piece.id);
    }
};

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    };
}

class BoardSquare extends React.Component {
    getSquareColour() {
        const { col, row } = this.props;
        const isEven = (col + row) % 2 === 1;
        return isEven ? 'white' : 'lightgrey';
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
                backgroundColor: color }}
            />
        );
    }

      render() {
        const { connectDropTarget, isOver, canDrop, icon, id, type } = this.props;
        return connectDropTarget(
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Square colour={this.getSquareColour()}>
                    { icon && id && <Piece icon={icon} id={id} type={type} />}
                </Square>
                { isOver && !canDrop && this.renderOverlay('red') }
                { !isOver && canDrop && this.renderOverlay('yellow') }
                { isOver && canDrop && this.renderOverlay('limegreen') }
            </div>
        );
    }
}

BoardSquare.propTypes = {
    row: PropTypes.number.isRequired,
    col: PropTypes.number.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired,
    id: PropTypes.string,
    type: PropTypes.string.isRequired,
    icon: PropTypes.string
};

export default DropTarget(PieceTypes, squareTarget, collect)(BoardSquare);
