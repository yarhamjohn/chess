import React from 'react';
import PropTypes from 'prop-types';
import BoardSquare from './board-square';
import Piece from './piece';
import { moveKnight, canMoveKnight } from '../shared/game';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { ItemTypes, Pieces } from '../shared/constants';

class Board extends React.Component {
    render() {
        const rows = [];
        for (let row = 0; row < 8; row++) {
            const squares = [];
            for (let col = 0; col < 8; col++) {
                squares.push(
                    this.renderSquare(col, row)
                )
            }
            rows.push(
                <div key={row} style={{display: 'flex'}}>
                    {squares}
                </div>
            )
        }
        return (
            <div>
                {rows}
            </div>
        );
    }

    renderSquare(col, row) {
        const keyId = `${col}_${row}`;
        return (
            <div key={keyId} 
                style={{ width: '25px', height: '25px' }}>
                <BoardSquare col={col} row={row} type={ItemTypes.KNIGHT}>
                    {this.renderPiece(col, row)}
                </BoardSquare>
            </div>
        )
    }

    renderPiece(col, row) {
        const [knightY, knightX] = this.props.knightPosition;
        if (row === knightX && col === knightY) {
            return <Piece type={ItemTypes.KNIGHT}>{Pieces.KNIGHT}</Piece>
        };
    }
}

Board.propTypes = {
    knightPosition: PropTypes.arrayOf(
        PropTypes.number.isRequired
    ).isRequired
}

export default DragDropContext(HTML5Backend)(Board);