import React from 'react';
import PropTypes from 'prop-types';
import Square from './square';
import Knight from './knight';
import { moveKnight, canMoveKnight } from '../game';

export default class Board extends React.Component {
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
        const black = (col + row) % 2 === 1;

        const [knightY, knightX] = this.props.knightPosition;
        const piece = (row === knightX && col === knightY) ? <Knight /> : null;

        const keyId = `${col}_${row}`;
        return (
            <div key={keyId} onClick={() => this.handleSquareClick(col, row) }>
                <Square black={black}>
                    {piece}
                </Square>
            </div>
        )
    }

    handleSquareClick(col, row) {
        if (canMoveKnight(col, row)) {
            moveKnight(col, row)
        }
    }
}

Board.propTypes = {
    knightPosition: PropTypes.arrayOf(
        PropTypes.number.isRequired
    ).isRequired
}