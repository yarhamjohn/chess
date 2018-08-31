import React from 'react';
import PropTypes from 'prop-types';
import BoardSquare from './board-square';
import Piece from './piece';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { Pieces } from '../shared/constants';

class Board extends React.Component {
    render() {
        const rows = [];
        for (let row = 0; row < 8; row++) {
            const squares = [];
            for (let col = 0; col < 8; col++) {
                const pieceData = this.getPieceData(col, row);
                
                if (pieceData === null) {
                    squares.push(this.renderSquare(col, row, null, null, null));
                } else {
                    squares.push(this.renderSquare(col, row, pieceData.icon, pieceData.id, pieceData.type));
                }
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

    renderSquare(col, row, icon, id, type) {
        const keyId = `${col}_${row}`;
        return (
            <div key={keyId} 
                style={{ width: '25px', height: '25px' }}>
                <BoardSquare col={col} row={row} icon={icon} id={id} type={type}/>
            </div>
        )
    }

    getPieceData(col, row) {
        const { pieces } = this.props;
        for (let i = 0; i < pieces.length; i++) {
            if (pieces[i].position[0] === col && pieces[i].position[1] === row) {
                return pieces[i];
            }
        }
        
        return null;
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
    ).isRequired
};

export default DragDropContext(HTML5Backend)(Board);