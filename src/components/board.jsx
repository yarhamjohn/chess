import React from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import BoardSquare from './board-square';

class Board extends React.Component {
    getPieceData(col, row) {
        const { pieces } = this.props;
        for (let i = 0; i < pieces.length; i += 1) {
            if (pieces[i].position[0] === col && pieces[i].position[1] === row) {
                return pieces[i];
            }
        }

        return null;
    }

    getRemovedPieces(colour) {
        if (this.props.removedPieces.length > 0) {
            const pieces = this.props.removedPieces.filter(piece => piece.colour === colour);
            return pieces.map(piece => piece.icon).join(' ');
        }

        return null;
    }

    renderSquare(col, row, icon, id, type) {
        const keyId = `${col}_${row}`;
        return (
            <div key={keyId} style={{ width: '25px', height: '25px' }} >
                <BoardSquare col={col} row={row} icon={icon} id={id} type={type} />
            </div>
        );
    }

    render() {
        const rows = [];
        for (let row = 0; row < 8; row += 1) {
            const squares = [];
            for (let col = 0; col < 8; col += 1) {
                const pieceData = this.getPieceData(col, row);

                if (pieceData === null) {
                    squares.push(this.renderSquare(col, row, null, null, null));
                } else {
                    squares.push(
                        this.renderSquare(col, row, pieceData.icon, pieceData.id, pieceData.type)
                    );
                }
            }
            rows.push(
                <div key={row} style={{ display: 'flex' }}>
                    { squares }
                </div>
            );
        }

        const removedWhitePieces = this.getRemovedPieces('white');
        const removedBlackPieces = this.getRemovedPieces('black');
        return (
            <div>
                <h1>It is { this.props.currentPlayer }'s turn</h1>
                { rows }
                { this.props.removedPieces.length > 0 &&
                    <div>
                        <h1>Removed pieces:</h1>
                        <p>White: { removedWhitePieces }</p>
                        <p>Black: { removedBlackPieces }</p>
                    </div>
                }
            </div>
        );
    }
}

Board.propTypes = {
    pieces: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            type: PropTypes.string.isRequired,
            icon: PropTypes.string.isRequired,
            colour: PropTypes.string.isRequired,
            startingPositions: PropTypes.arrayOf(
                PropTypes.arrayOf(
                    PropTypes.number
                )
            ).isRequired,
            position: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired
        }).isRequired
    ).isRequired,
    currentPlayer: PropTypes.string.isRequired,
    removedPieces: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            type: PropTypes.string.isRequired,
            icon: PropTypes.string.isRequired,
            colour: PropTypes.string.isRequired,
            startingPositions: PropTypes.arrayOf(
                PropTypes.arrayOf(
                    PropTypes.number
                )
            ).isRequired,
            position: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired
        })
    ).isRequired
};

export default DragDropContext(HTML5Backend)(Board);
