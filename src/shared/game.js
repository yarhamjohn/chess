import { Pieces } from './constants';

let playingPieces = [];
let observer = null;

export function observe(o) {
    if (observer) {
        throw new Error('Multiple observers not implemented');
    }
    observer = o;
    populatePlayingPieces();
    emitChange();
}

function populatePlayingPieces() {
    for (var key in Pieces) {
        const numPieces = Pieces[key].startingPositions.length;
        for (let i = 0; i < numPieces; i++) {
            playingPieces.push(
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
    observer(playingPieces);
}

export function movePiece(newPosition, pieceId) {
    for (var key in playingPieces) {
        if (playingPieces[key].id === pieceId) {
            playingPieces[key].position = newPosition;

            //TODO:
            //If occupied by an opposition piece then remove it

            break;
        };
    };
    emitChange();
}

export function canMovePiece(newPosition, pieceId) {
    for (var key in playingPieces) {
        const playingPiece = playingPieces[key];
        if (playingPiece.id === pieceId) {
            return isValidMove(newPosition, playingPiece);
        };
    };
}

function isValidMove(newPosition, playingPiece) {
    const [fromCol, fromRow] = playingPiece.position;   
    const [toCol, toRow] = newPosition;  
    const rowChange = toRow - fromRow;
    const colChange = toCol - fromCol; 

    const pieceNotMoved = rowChange === 0 && colChange === 0;
    if (pieceNotMoved) {
        return false;
    }

    if (teamOccupiesTarget(toCol, toRow, playingPiece.piece.colour)) {
        return false;
    }

    switch (playingPiece.piece.type) {
        case 'king': 
            return validKingMove(rowChange, colChange);
        case 'queen':
            return validQueenMove(rowChange, colChange, playingPiece);
        case 'rook':
            return validRookMove(rowChange, colChange, playingPiece);
        case 'bishop':
            return validBishopMove(rowChange, colChange, playingPiece);
        case 'knight':
            return validKnightMove(rowChange, colChange);
        default:
            return validPawnMove(rowChange, colChange, playingPiece);
    };
}


function validKingMove(rowChange, colChange) {
    const absRowChange = Math.abs(rowChange);
    const absColChange = Math.abs(colChange);

    return (
        (absRowChange === 1 && absColChange === 1)
        || (absRowChange === 0 && absColChange === 1)
        || (absRowChange === 1 && absColChange === 0)
    );
}


function validQueenMove(rowChange, colChange, playingPiece) {
    const colour = playingPiece.piece.colour;
    const target = [playingPiece.position[0] + colChange, playingPiece.position[1] + rowChange];

    const isDiagonal = Math.abs(rowChange) === Math.abs(colChange);
    if (isDiagonal) {
        return noDiagonalObstruction(target, playingPiece.position, rowChange, colChange, colour);
    }

    const isStraight = rowChange === 0 || colChange === 0;
    if (isStraight) {
        return noStraightObstruction(target, playingPiece.position, rowChange, colChange, colour);
    }

    return false;
}

function validRookMove(rowChange, colChange, playingPiece) {
    if (rowChange !== 0 && colChange !== 0) {
        return false;
    }

    const colour = playingPiece.piece.colour;
    const target = [playingPiece.position[0] + colChange, playingPiece.position[1] + rowChange];

    return noStraightObstruction(target, playingPiece.position, rowChange, colChange, colour);
}

function validBishopMove(rowChange, colChange, playingPiece) {
    if (Math.abs(rowChange) !== Math.abs(colChange)) {
        return false;
    }

    const colour = playingPiece.piece.colour;
    const target = [playingPiece.position[0] + colChange, playingPiece.position[1] + rowChange];

    return noDiagonalObstruction(target, playingPiece.position, rowChange, colChange, playingPiece.piece.colour);
}

function validKnightMove(rowChange, colChange) {
    const absRowChange = Math.abs(rowChange);
    const absColChange = Math.abs(colChange);
    const validMoveOne = absRowChange === 2 && absColChange === 1;
    const validMoveTwo = absRowChange === 1 && absColChange === 2;

    return validMoveOne || validMoveTwo;
}

function validPawnMove(rowChange, colChange, playingPiece) {
    const [currentCol, currentRow] = playingPiece.position;
    const startingRow = playingPiece.piece.startingPositions[0][1];
    const isFirstMove = currentRow === startingRow;

    const colour = playingPiece.piece.colour;
    const moveDirection = colour === 'white' ? -1 : 1;

    const sameColumn = colChange === 0;
    const forwardTwoRows = rowChange === (2 * moveDirection);
    if (forwardTwoRows && sameColumn && isFirstMove && pawnIsNotObstructed(playingPiece.position, moveDirection)) {
        return true;
    }

    const leftOneCol = colChange === -1;
    const rightOneCol = colChange === 1;
    const forwardOneRow = rowChange === (1 * moveDirection);
    const leftDiagonalSquare = [currentCol - 1, currentRow + moveDirection];
    const rightDiagonalSquare = [currentCol + 1, currentRow + moveDirection];
    return ((forwardOneRow && sameColumn)
        || (forwardOneRow && leftOneCol && targetContainsOpponent(leftDiagonalSquare, colour))
        || (forwardOneRow && rightOneCol && targetContainsOpponent(rightDiagonalSquare, colour)))
}

function pawnIsNotObstructed(currentPosition, moveDirection) {
    for (let key in playingPieces) {
        const [toCol, toRow] = playingPieces[key].position;
        const [currentCol, currentRow] = currentPosition;
        const rowInFront = currentRow + (1 * moveDirection);

        if (toCol === currentCol && toRow === rowInFront) {
            return false;
        }
    }

    return true;
}

function noStraightObstruction(target, start, rowChange, colChange, colour) {
    const [startCol, startRow] = start;

    let moveNum = 1;
    if (colChange === 0) {
        const distance = Math.abs(rowChange);
        const rowDirection = rowChange / distance;

        let rowNum = rowDirection;
        while (moveNum < distance) {
            if (targetIsOccupied([startCol, startRow + rowNum])) {
                return false;
            }
            rowNum += rowDirection;
            moveNum++;
        }
    } else {
        const distance = Math.abs(colChange);
        const colDirection = colChange / distance;
        
        let colNum = colDirection;
        while (moveNum < distance) {
            if (targetIsOccupied([startCol + colNum, startRow])) {
                return false;
            }
            colNum += colDirection;
            moveNum++;
        }
    }

    return targetContainsOpponent(target, colour) || !targetIsOccupied(target);
}

function noDiagonalObstruction(target, start, rowChange, colChange, colour) {
    const [startCol, startRow] = start;
    const rowMoveDirection = rowChange / Math.abs(rowChange);
    const colMoveDirection = colChange / Math.abs(colChange);
    const diagonalDistance = Math.abs(colChange);

    let moveNum = 1;
    let colNum = colMoveDirection;
    let rowNum = rowMoveDirection;
    while (moveNum < diagonalDistance) {
        if (targetIsOccupied([startCol + colNum, startRow + rowNum])) {
            return false;
        }
        rowNum += rowMoveDirection;
        colNum += colMoveDirection;
        moveNum++;
    }

    return targetContainsOpponent(target, colour) || !targetIsOccupied(target);
}

function targetContainsOpponent(targetPosition, colour) {
    for (let key in playingPieces) {
        const playingPiece = playingPieces[key];
        const [col, row] = playingPiece.position;
        const [targetCol, targetRow] = targetPosition;

        if (col === targetCol 
            && row === targetRow 
            && playingPiece.piece.colour !== colour) {
            return true;
        }
    }

    return false;
}

function targetIsOccupied(targetPosition) {
    for (let key in playingPieces) {
        const playingPiece = playingPieces[key];
        const [col, row] = playingPiece.position;
        const [targetCol, targetRow] = targetPosition;

        if (col === targetCol && row === targetRow) {
            return true;
        }
    }

    return false;
}

function teamOccupiesTarget(toCol, toRow, pieceColour) {
    for (var key in playingPieces) {
        const playingPiece = playingPieces[key];
        const positionMatches = playingPiece.position[0] === toCol && playingPiece.position[1] === toRow;
        if (positionMatches) {
            const colourMatches = playingPiece.piece.colour === pieceColour;
            return colourMatches;
        } 
    }
}