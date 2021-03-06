import React from 'react';
import PropTypes from 'prop-types';
import { DropTarget, DragLayer } from 'react-dnd';
import flow from 'lodash.flow';
import Square from './square';
import Piece from './piece';
import { canMovePiece, movePiece, getPiece } from '../shared/game';
import { PieceTypes, Pieces } from '../shared/constants';

const squareDropTarget = {
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

function dropCollect(connect, monitor) {
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
    };
}

function dragCollect(monitor) {
    return {
        isDragging: monitor.isDragging(),
        draggingItem: monitor.getItem(),
        distanceMoved: monitor.getDifferenceFromInitialOffset(),
        cursorStartPosition: monitor.getInitialClientOffset(),
        kingSquarePosition: monitor.getInitialSourceClientOffset()
    };
}

class BoardSquare extends React.Component {
    getSquareColour() {
        const { col, row, highlightSquare } = this.props;
        if (highlightSquare) {
            return 'lightpink';
        }
        const isEven = (col + row) % 2 === 1;
        return isEven ? 'white' : 'lightgrey';
    }

    renderOverlay(color) {
        return (
            <div style={{ backgroundColor: color }} className="board-square--overlay" />
        );
    }
    
    renderCastleOverlay(tempIcon) {
        return (
            <div className="board-square--overlay-castle">
                <span className="piece">
                    { tempIcon }
                </span>
            </div>
        );
    }

    kingIsAttemptingToCastle() {
        const { distanceMoved, kingSquarePosition, cursorStartPosition } = this.props;

        const cursorDistanceIntoSquare = Math.ceil(cursorStartPosition.x - kingSquarePosition.x);
        const castlingSquareLeft = distanceMoved.x < (-25 - cursorDistanceIntoSquare) && distanceMoved.x > (-50 - cursorDistanceIntoSquare);
        const castlingSquareRight = distanceMoved.x > (50 - cursorDistanceIntoSquare) && distanceMoved.x < (75 - cursorDistanceIntoSquare);

        return castlingSquareLeft || castlingSquareRight;
    }

    render() {
        const { connectDropTarget, isOver, canDrop, icon, id, type, isDragging, draggingItem, row, col, distanceMoved, currentPlayer, cursorStartPosition, kingSquarePosition } = this.props;

        let castleIcon = null;
        let hideCastle = false;
        if (isDragging && !isOver) {
            const draggingPiece = getPiece(draggingItem.id);
            const kingInSameRow = draggingPiece.position[1] === row;

            if (draggingPiece.type === 'king' && draggingPiece.canCastle && kingInSameRow && draggingPiece.colour === currentPlayer) {
                const kingAttemptingCastle = this.kingIsAttemptingToCastle();
                const kingCastlingLeft = draggingPiece.position[0] - col > 0 && distanceMoved.x < 0;
                const kingCastlingRight = draggingPiece.position[0] - col < 0 && distanceMoved.x > 0;
        
                const cursorDistanceIntoSquare = Math.ceil(cursorStartPosition.y - kingSquarePosition.y);
                const draggingInSameRow = (distanceMoved.y < (25 - cursorDistanceIntoSquare)) && (distanceMoved.y > (-25 + cursorDistanceIntoSquare));

                if (draggingInSameRow && kingAttemptingCastle && (kingCastlingLeft || kingCastlingRight)) {
                    const kingInAdjacentColumn = Math.abs(draggingPiece.position[0] - col) === 1;
                    const isCornerSquare = (row === 0 && col === 0) || (row === 0 && col === 7) || (row === 7 && col === 0) || (row === 7 && col === 7);

                    if (kingInAdjacentColumn) {
                        castleIcon = draggingPiece.colour === 'white' ? Pieces.WHITE_ROOK.icon : Pieces.BLACK_ROOK.icon;
                    } else if (isCornerSquare) {
                        hideCastle = true;
                    }
                }
            }
        }

        return connectDropTarget(
            <div className="board-square" >
                <Square colour={this.getSquareColour()}>
                    { hideCastle ? '' : icon && id && type && <Piece icon={icon} id={id} type={type} /> }
                </Square>

                { isOver && !canDrop && this.renderOverlay('red') }
                { castleIcon === null ? (!isOver && canDrop && this.renderOverlay('yellow')) : !isOver && canDrop && this.renderCastleOverlay(castleIcon) }
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
    isDragging: PropTypes.bool.isRequired,
    distanceMoved: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number
    }),
    kingSquarePosition: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number
    }),
    cursorStartPosition: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number
    }),
    id: PropTypes.string,
    type: PropTypes.string,
    icon: PropTypes.string,
    colour: PropTypes.string,
    highlightSquare: PropTypes.bool.isRequired,
    draggingItem: PropTypes.object,
    currentPlayer: PropTypes.string.isRequired
};

export default flow(
    DropTarget(PieceTypes, squareDropTarget, dropCollect),
    DragLayer(dragCollect)
    )(BoardSquare);
