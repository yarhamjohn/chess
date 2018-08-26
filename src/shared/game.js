import { Pieces } from './constants';

let pieces = [];
let observer = null;

function populateInitialPieces() {
    for (var key in Pieces) {
        const numPieces = Pieces[key].startingPositions.length;
        for (let i = 0; i < numPieces; i++) {
            pieces.push(
                {
                    id: `${key}_${i}`,  
                    piece: Pieces[key],
                    position: Pieces[key].startingPositions[i]
                }
            )
        }
    }
}

function emitChange() {
    observer(pieces);
}

export function observe(o) {
    if (observer) {
        throw new Error('Multiple observers not implemented');
    }
    observer = o;
    populateInitialPieces();
    emitChange();
}

export function movePiece(newPosition, pieceId) {
    for (var key in pieces) {
        if (pieces[key].id === pieceId) {
            pieces[key].position = newPosition;

            //TODO:
            //If occupied by an opposition piece then remove it

            break;
        };
    };
    emitChange();
}

export function canMovePiece(newPosition, pieceId) {
    for (var key in pieces) {
        if (pieces[key].id === pieceId) {
            return isValidMove(newPosition, pieces[key]);
        };
    };
}

function isValidMove(newPosition, pieceData) {
    const [col, row] = pieceData.position;   
    const [toCol, toRow] = newPosition;  
    const rowChange = toRow - row;
    const colChange = toCol - col; 

    if (rowChange === 0 && colChange === 0) {
        return false;
    }

    if (isAlreadyOccupiedByTeam(toCol, toRow, pieceData.piece.colour)) {
        return false;
    }
    switch (pieceData.piece.type) {
        case 'king': 
            return validKingMove(rowChange, colChange);
        case 'queen':
            return validQueenMove(rowChange, colChange);
        case 'rook':
            return validRookMove(rowChange, colChange);
        case 'bishop':
            return validBishopMove(rowChange, colChange);
        case 'knight':
            return validKnightMove(rowChange, colChange);
        default:
            return validPawnMove(rowChange, colChange, pieceData);
    };
}

function isAlreadyOccupiedByTeam(toCol, toRow, pieceColour) {
    for (var key in pieces) {
        const colourMatches = pieces[key].piece.colour === pieceColour;
        const positionMatches = pieces[key].position[0] === toCol && pieces[key].position[1] === toRow;
        if (positionMatches) {
            return colourMatches;
        } 
    }
}

function validKingMove(rowChange, colChange) {
    return (
        (Math.abs(rowChange) === 1 && Math.abs(colChange) === 1)
        || (Math.abs(rowChange) === 0 && Math.abs(colChange) === 1)
        || (Math.abs(rowChange) === 1 && Math.abs(colChange) === 0)
    );
}


function validQueenMove(rowChange, colChange) {
    // Anything is valid except going beyond another piece
    return false;
}

function validRookMove(rowChange, colChange) {
    //valid in straight lines but not beyond other pieces except for castling...!
    return false;
}

function validBishopMove(rowChange, colChange) {
    // valid diagonally but not beyond other pieces
    return false;
}

function validKnightMove(rowChange, colChange) {
    const validMoveOne = Math.abs(rowChange) === 2 && Math.abs(colChange) === 1;
    const validMoveTwo = Math.abs(rowChange) === 1 && Math.abs(colChange) === 2;

    return validMoveOne || validMoveTwo;
}

function validPawnMove(rowChange, colChange, pieceData) {
    const currentRow = pieceData.position[1];
    const startingRow = pieceData.piece.startingPositions[0][1];
    const isFirstMove = currentRow === startingRow;
    const colour = pieceData.piece.colour;

    if (colour === 'white') {
        const moveDirection = -1;
        return validPawnMoveForColour(colour, moveDirection, pieceData.position, rowChange, colChange, isFirstMove);
    }

    const moveDirection = 1;
    return validPawnMoveForColour(colour, moveDirection, pieceData.position, rowChange, colChange, isFirstMove);
}

function validPawnMoveForColour(colour, moveDirection, position, rowChange, colChange, isFirstMove) {
    const sameColumn = colChange === 0;
    const forwardTwoRows = rowChange === (2 * moveDirection);
    if (forwardTwoRows && sameColumn && isFirstMove && noObstructingPiece(position, moveDirection)) {
        return true;
    }

    const leftOneCol = colChange === -1;
    const rightOneCol = colChange === 1;
    const forwardOneRow = rowChange === (1 * moveDirection);
    return ((forwardOneRow && sameColumn)
        || (forwardOneRow && leftOneCol && targetContainsOpponent([position[0] - 1, position[1] + moveDirection], colour))
        || (forwardOneRow && rightOneCol && targetContainsOpponent([position[0] + 1, position[1] + moveDirection], colour)))
}

function noObstructingPiece(currentPosition, moveDirection) {
    for (let key in pieces) {
        const col = pieces[key].position[0];
        const row = pieces[key].position[1];
        const currentCol = currentPosition[0];
        const rowInFront = currentPosition[1] + (1 * moveDirection);
        if (col === currentCol && row === rowInFront) {
            return false;
        }
    }

    return true;
}

function targetContainsOpponent(targetPosition, colour) {
    for (let key in pieces) {
        const col = pieces[key].position[0];
        const row = pieces[key].position[1];
        const targetCol = targetPosition[0];
        const targetRow = targetPosition[1];

        if (col === targetCol 
            && row === targetRow 
            && pieces[key].piece.colour !== colour) {
            return true;
        }
    }
}
