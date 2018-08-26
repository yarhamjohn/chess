import React from 'react';
import PropTypes from 'prop-types';
import Square from './square';
import { DropTarget } from 'react-dnd';
import { canMovePiece, movePiece } from '../shared/game';
import Piece from './Piece';
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
}

function collect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    }
}

class BoardSquare extends React.Component {
    render() {
        const { connectDropTarget, isOver, canDrop, piece, id } = this.props;
        return connectDropTarget(
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <Square colour={this.getSquareColour()}>
                    {piece !== null && <Piece piece={piece} id={id} />}
                </Square>
                {isOver && !canDrop && this.renderOverlay('red')}
                {!isOver && canDrop && this.renderOverlay('yellow')}
                {isOver && canDrop && this.renderOverlay('limegreen')}
            </div>
        );
    }

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
    id: PropTypes.string,
    piece: PropTypes.shape({
        type: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        colour: PropTypes.string.isRequired,
        startingPositions: PropTypes.arrayOf(
            PropTypes.arrayOf(
                PropTypes.number
            )
        )
    })
};

export default DropTarget(PieceTypes, squareTarget, collect)(BoardSquare);
