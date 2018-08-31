import { Pieces } from './constants';

const oneRowDown = 1;
const oneRowUp = -1;

let playingPieces = [];
let removedPieces = [];
let observer = null;

function reset() {
    observer = null;
    playingPieces = [];
    removedPieces = [];
}

function emitChange() {
    observer(playingPieces);
}

function populatePlayingPieces() {
    Object.keys(Pieces).forEach((key) => {
        const piece = Pieces[key];
        const numPieces = piece.startingPositions.length;
        for (let i = 0; i < numPieces; i += 1) {
            playingPieces.push(
                {
                    id: `${key}_${i}`,
                    type: piece.type,
                    icon: piece.icon,
                    colour: piece.colour,
                    startingPositions: piece.startingPositions,
                    position: piece.startingPositions[i],
                    hasMoved: false
                }
            );
        }
    });
}

function observe(o) {
    if (observer) {
        reset();
    }
    observer = o;
    populatePlayingPieces();
    emitChange();
}

function movePiece(newPosition, pieceId) {
    let pieceIdToRemove = [];
    let pieceToAdd = [];
    for (var key in playingPieces) {
        if (playingPieces[key].id === pieceId) {
            const opponentColour = playingPieces[key].colour === 'white' ? 'black' : 'white';
            if (targetIsOccupied(newPosition, opponentColour)) {
                for (var key3 in playingPieces) {
                    if (playingPieces[key3].position[0] === newPosition[0] && playingPieces[key3].position[1] === newPosition[1]) {
                        pieceIdToRemove.push(playingPieces[key3].id);
                    }
                } 
            }

            const originalPosition = playingPieces[key].position;
            playingPieces[key].position = newPosition;
            playingPieces[key].hasMoved = true;

            if (playingPieces[key].type === 'king' && Math.abs(originalPosition[0] - newPosition[0]) === 2) {
                const direction = originalPosition[0] - newPosition[0] > 0 ? 0 : 7;
                const rookToCastle = playingPieces.filter(playingPiece => playingPiece.position[0] === direction && playingPiece.position[1] === newPosition[1])[0];

                for (var key2 in playingPieces) {
                    if (playingPieces[key2].id === rookToCastle.id) {
                        const rookDirection = originalPosition[0] - newPosition[0] > 0 ? 1 : -1 ;
                        playingPieces[key2].position = [newPosition[0] + rookDirection, playingPieces[key2].position[1]];
                        playingPieces[key2].hasMoved = true;
                    }
                }
            }

            if (playingPieces[key].type === 'pawn' && (newPosition[1] === 0 || newPosition[1] === 7)) {
                const availablePieces = removedPieces.filter(playingPiece => playingPiece.colour === playingPieces[key].colour);
                if (availablePieces.length === 0) {
                    pieceIdToRemove.push(playingPieces[key].id);
                    break;
                }
                                
                let highestRankPiece = null;
                for (let i = 0; i < availablePieces.length; i++) {
                    if (highestRankPiece === null && availablePieces[i] !== 'pawn') {
                        highestRankPiece = availablePieces[i];
                    }

                    if (availablePieces[i].type === 'queen') {
                        highestRankPiece = availablePieces[i];
                        break;
                    }

                    if (availablePieces[i].type === 'rook' && highestRankPiece.pce.type !== 'queen') {
                        highestRankPiece = availablePieces[i];
                    }

                    if (availablePieces[i].type === 'bishop' && highestRankPiece.type !== 'queen' && highestRankPiece.type !== 'rook') {
                        highestRankPiece = availablePieces[i];
                    }

                    if (availablePieces[i].type === 'knight' && highestRankPiece.type !== 'queen' && highestRankPiece.type !== 'rook' && highestRankPiece.type !== 'bishop') {
                        highestRankPiece = availablePieces[i];
                    }
                }

                if (highestRankPiece !== null) {
                    highestRankPiece.position = [newPosition[0], newPosition[1]];
                    pieceToAdd.push(highestRankPiece);
                }

                for (var key4 in playingPieces) {
                    if (playingPieces[key4].id === playingPieces[key].id) {
                        pieceIdToRemove.push(...playingPieces.map(pp => pp.id).filter(id => id === playingPieces[key4].id))
                    }
                }
            }

            break;
        };
    };

    if (pieceIdToRemove.length > 0) {
        for (let i = 0; i < pieceIdToRemove.length; i++) {
            removedPieces.push(...playingPieces.filter(playingPiece => playingPiece.id === pieceIdToRemove[i]));
            playingPieces = playingPieces.filter(playingPiece => playingPiece.id !== pieceIdToRemove[i]);
        }
    }

    if (pieceToAdd.length > 0) {
        for (let i = 0; i < pieceToAdd.length; i++) {
            removedPieces = removedPieces.filter(playingPiece => playingPiece.id !== pieceToAdd[i].id);
            playingPieces.push(pieceToAdd[i]);
        }
    }

    emitChange();
}

function getPiece(pieceId) {
    return playingPieces.find(piece => piece.id === pieceId);
}

function targetIsOccupied(targetPosition, pieceColour = null) {
    const targetPiece = playingPieces.find((piece) => {
        const [fromCol, fromRow] = piece.position;
        const [targetCol, targetRow] = targetPosition;

        return fromCol === targetCol && fromRow === targetRow;
    });

    if (targetPiece && pieceColour) {
        return targetPiece.colour === pieceColour;
    }

    return targetPiece;
}

function validKnightMove(rowChange, colChange) {
    const validMoveOne = Math.abs(rowChange) === 2 && Math.abs(colChange) === 1;
    const validMoveTwo = Math.abs(rowChange) === 1 && Math.abs(colChange) === 2;

    return validMoveOne || validMoveTwo;
}

function isValidMove(newPosition, piece) {
    const rowChange = newPosition[1] - piece.position[1];
    const colChange = newPosition[0] - piece.position[0];

    const pieceUnmoved = rowChange === 0 && colChange === 0;
    const targetOccupiedByTeam = targetIsOccupied(newPosition, piece.colour);
    if (pieceUnmoved || targetOccupiedByTeam) {
        return false;
    }

    switch (piece.type) {
        case 'king':
            return validKingMove(rowChange, colChange, piece);
        case 'queen':
            return validQueenMove(rowChange, colChange, piece);
        case 'rook':
            return validRookMove(rowChange, colChange, piece);
        case 'bishop':
            return validBishopMove(rowChange, colChange, piece);
        case 'knight':
            return validKnightMove(rowChange, colChange);
        default:
            return validPawnMove(rowChange, colChange, piece);
    }
}

function canMovePiece(newPosition, pieceId) {
    const piece = getPiece(pieceId);
    if (piece) {
        return isValidMove(newPosition, piece);
    }

    return false;
}

function validKingMove(rowChange, colChange, playingPiece) {
    const absRowChange = Math.abs(rowChange);
    const absColChange = Math.abs(colChange);

    const castlingMove = absRowChange === 0 && absColChange === 2;
    if (castlingMove) {
        return isValidCastle(rowChange, colChange, playingPiece);
    }

    return (
        (absRowChange === 1 && absColChange === 1)
        || (absRowChange === 0 && absColChange === 1)
        || (absRowChange === 1 && absColChange === 0)
    );
}

function isValidCastle(rowChange, colChange, playingPiece) {
    if (playingPiece.hasMoved || castleHasMoved(colChange, playingPiece.position[1])) {
        return false;
    }

    const targetCol = colChange > 0 ? 7 : 0;
    const target = [colChange, playingPiece.position[1]];
    if (!noStraightObstruction(target, playingPiece.position, rowChange, targetCol - playingPiece.position[0], playingPiece.colour)) {
        return false;
    }

    return true;
}

function castleHasMoved(colChange, row) {
    let cornerPiece = null;

    if (colChange < 0) {
        cornerPiece = playingPieces.filter(playingPiece => playingPiece.position[0] === 0 && playingPiece.position[1] === row);
    } else {
        cornerPiece = playingPieces.filter(playingPiece => playingPiece.position[0] === 7 && playingPiece.position[1] === row);
    }
    
    if (cornerPiece.length === 1) {
        return (cornerPiece[0].type !== 'rook' || cornerPiece[0].hasMoved)
    }

    return true;
}

function validQueenMove(rowChange, colChange, playingPiece) {
    const colour = playingPiece.colour;
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

    const colour = playingPiece.colour;
    const target = [playingPiece.position[0] + colChange, playingPiece.position[1] + rowChange];

    return noStraightObstruction(target, playingPiece.position, rowChange, colChange, colour);
}

function validBishopMove(rowChange, colChange, playingPiece) {
    if (Math.abs(rowChange) !== Math.abs(colChange)) {
        return false;
    }

    const target = [playingPiece.position[0] + colChange, playingPiece.position[1] + rowChange];

    return noDiagonalObstruction(target, playingPiece.position, rowChange, colChange, playingPiece.colour);
}

function validPawnSpecialMove(rowChange, colChange, playingPiece, pieceColour) {
    const currentPosition = playingPiece.position;
    const targetPosition = [currentPosition[0], currentPosition[1] + rowChange];
    const isFirstMove = !playingPiece.hasMoved;
    const isObstructed = noStraightObstruction(targetPosition, currentPosition, rowChange, colChange, pieceColour);

    return (isFirstMove && isObstructed);
}

function validPawnMove(rowChange, colChange, piece) {
    const playingPiece = getPiece(piece.id);
    const correctDirection = (piece.colour === 'white' && rowChange < 0) || (piece.colour === 'black' && rowChange > 0);

    const twoRowMove = colChange === 0 && Math.abs(rowChange) === 2;
    if (twoRowMove && correctDirection) {
        return validPawnSpecialMove(rowChange, colChange, playingPiece, piece.colour);
    }

    const oneRowMove = colChange === 0 && Math.abs(rowChange) === 1;
    if (oneRowMove && correctDirection) {
        const targetPosition = [playingPiece.position[0], playingPiece.position[1] + rowChange];
        return !targetIsOccupied(targetPosition);
    }

    const diagonalMove = Math.abs(colChange) === 1 && Math.abs(rowChange) === 1;
    if (diagonalMove && correctDirection) {
        const targetPosition = [playingPiece.position[0] + colChange, playingPiece.position[1] + rowChange];
        const opponentColour = playingPiece.colour === 'white' ? 'black' : 'white';
        return targetIsOccupied(targetPosition, opponentColour);
    }

    return false;
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
            moveNum += 1;
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
            moveNum += 1;
        }
    }

    return !targetIsOccupied(target, colour);
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
        moveNum += 1;
    }

    return !targetIsOccupied(target, colour);
}

export { observe, movePiece, canMovePiece };
