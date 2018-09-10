import React from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import BoardSquare from './board-square';
import { Pieces } from '../shared/constants';
import { newGame, promotePawn } from '../shared/game';

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

    renderRemovedPieces(colour) {
        const { removedPieces } = this.props;
        let pieces = [];
        if (removedPieces.length > 0) {
            pieces = removedPieces.filter(piece => piece.colour === colour).map(piece => <span key={piece.id}>{piece.icon}</span>);
        }

        return <div className="board--removed-pieces">{ pieces }</div>;
    }

    renderSquare(col, row, icon, id, type, colour) {
        const keyId = `${col}_${row}`;
        const highlightSquare = this.props.inCheck && type === 'king' && this.props.currentPlayer === colour;
        return (
            <div key={keyId} className="board--square" >
                <BoardSquare col={col} row={row} icon={icon} id={id} type={type} highlightSquare={highlightSquare} />
            </div>
        );
    }

    renderGameStatusMessage() {
        const { promotion, stalemate, gameWon, currentPlayer } = this.props;
        if (promotion) {
            return this.renderPromotionOptions();
        }

        let message = '';
        if (gameWon) {
            message = `${currentPlayer} has lost!`;
        } else if (stalemate) {
            message = 'The game is a draw.';
        }

        message = `It is ${currentPlayer}'s turn`;

        return (
            <div className="board--header">
                <span className="board--game-status">{ message }</span>
            </div>
        );
    }

    renderPromotionOptions() {
        const { currentPlayer } = this.props;

        const options = [];
        Object.keys(Pieces).forEach((key) => {
            const piece = Pieces[key];
            const correctColour = piece.colour === currentPlayer;
            const correctPiece = piece.type === 'queen' || piece.type === 'rook' || piece.type === 'bishop' || piece.type === 'knight';
            if (correctColour && correctPiece) {
                options.push(<button key={piece.type} onClick={() => promotePawn(piece)}>{piece.icon}</button>);
            }
        });

        return (
            <div className="board--header">
                <span className="board--game-status">Select a piece to promote: </span>
                { options }
            </div>
        );
    }

    renderRows() {
        const rows = [];
        for (let row = 0; row < 8; row += 1) {
            const squares = [];
            for (let col = 0; col < 8; col += 1) {
                const pieceData = this.getPieceData(col, row);
                if (pieceData === null) {
                    squares.push(
                        this.renderSquare(col, row, null, null, null, null)
                    );
                } else {
                    squares.push(
                        this.renderSquare(col, row, pieceData.icon, pieceData.id, pieceData.type, pieceData.colour)
                    );
                }
            }
            rows.push(
                <div key={row} className="board--grid-row" >
                    { squares }
                </div>
            );
        }

        return <div>{ rows }</div>;
    }

    render() {
        return (
            <div className="board" >
                <h1 className="board--header">Welcome to two-player chess</h1>
                { this.renderGameStatusMessage() }
                <div className="board--grid">
                    { this.renderRemovedPieces('white') }
                    { this.renderRows() }
                    { this.renderRemovedPieces('black') }
                </div>
                <div>
                    <button onClick={() => newGame()} className="new-game-button">New Game</button>
                </div>
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
    ).isRequired,
    inCheck: PropTypes.bool.isRequired,
    gameWon: PropTypes.bool.isRequired,
    stalemate: PropTypes.bool.isRequired,
    promotion: PropTypes.bool.isRequired
};

export default DragDropContext(HTML5Backend)(Board);
