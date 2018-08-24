import React from 'react';
import PropTypes from 'prop-types';
import Square from './square';
import Knight from './knight';

export default class Board extends React.Component {
    render() {
        const rows = [];
        for (let row = 0; row < 8; row++) {
            const squares = [];
            for (let col = 0; col < 8; col++) {
                squares.push(
                    this.renderSquare(row, col)
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

    renderSquare(x, y) {
        const black = (x + y) % 2 === 1;

        const [knightY, knightX] = this.props.knightPosition;
        const piece = (x === knightX && y === knightY) ? <Knight /> : null;

        const keyId = `${x}_${y}`;
        return (
            <Square key={keyId} black={black}>
                {piece}
            </Square>
        )
    }
}

Board.propTypes = {
    knightPosition: PropTypes.arrayOf(
        PropTypes.number.isRequired
    ).isRequired
}