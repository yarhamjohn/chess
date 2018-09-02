import { Pieces } from './constants';

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

function updatePiecePosition(newPosition, pieceToMove) {
    Object.keys(playingPieces).forEach((key) => {
        if (playingPieces[key].id === pieceToMove.id) {
            playingPieces[key].position = newPosition;
            playingPieces[key].hasMoved = true;
        }
    });
}

function addPieceToBoard(piece) {
    playingPieces.push(piece);
}

function removePieceFromBoard(piece) {
    playingPieces = playingPieces.filter(playingPiece => playingPiece.id !== piece.id);
    removedPieces.push(piece);
}

function getPieceFromId(pieceId) {
    return playingPieces.find(piece => piece.id === pieceId);
}

function getPieceFromPosition(piecePosition) {
    return playingPieces.find(piece =>
        piece.position[0] === piecePosition[0] && piece.position[1] === piecePosition[1]
    );
}

function promotePawn(newPosition, pawn) {
    const queens = playingPieces.concat(removedPieces).filter(piece => piece.type === 'queen' && piece.colour === pawn.colour);
    const splitQueenId = queens[0].id.split('_');
    const newQueen = queens[0];
    newQueen.id = splitQueenId[0].concat('_', splitQueenId[1], '_', queens.length);
    newQueen.position = newPosition;
    newQueen.hasMoved = true;

    addPieceToBoard(newQueen);
    removePieceFromBoard(pawn);
}

function performCastle(pieceToMove, newPosition) {
    const rookCol = pieceToMove.position[0] - newPosition[0] > 0 ? 0 : 7;
    const rookToCastle = getPieceFromPosition([rookCol, newPosition[1]]);
    const rookDirection = rookToCastle.position[0] - newPosition[0] > 0 ? -1 : 1;
    const newRookPosition = [newPosition[0] + rookDirection, rookToCastle.position[1]];
    updatePiecePosition(newRookPosition, rookToCastle);
    updatePiecePosition(newPosition, pieceToMove);
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

function movePiece(newPosition, pieceId) {
    const pieceToMove = getPieceFromId(pieceId);
    const opponentColour = pieceToMove.colour === 'white' ? 'black' : 'white';

    const colChange = Math.abs(pieceToMove.position[0] - newPosition[0]);
    const castlingMove = pieceToMove.type === 'king' && colChange === 2;
    if (castlingMove) {
        performCastle(pieceToMove, newPosition);
        emitChange();
        return;
    }

    const targetContainsOpponent = targetIsOccupied(newPosition, opponentColour);
    if (targetContainsOpponent) {
        const targetPiece = getPieceFromPosition(newPosition);
        targetPiece.hasMoved = true;
        removePieceFromBoard(targetPiece);
    }

    updatePiecePosition(newPosition, pieceToMove);

    const endRow = newPosition[1] === 0 || newPosition[1] === 7;
    const pawnReachedEnd = pieceToMove.type === 'pawn' && endRow;
    if (pawnReachedEnd) {
        promotePawn(newPosition, pieceToMove);
    }

    emitChange();
}

function noStraightObstruction(target, piece, rowChange, colChange) {
    const [startCol, startRow] = piece.position;

    let moveNum = 1;
    if (colChange === 0) {
        const numRows = Math.abs(rowChange);
        const rowDirection = rowChange / numRows;

        let rowNum = rowDirection;
        while (moveNum < numRows) {
            if (targetIsOccupied([startCol, startRow + rowNum])) {
                return false;
            }
            rowNum += rowDirection;
            moveNum += 1;
        }
    } else {
        const numCols = Math.abs(colChange);
        const colDirection = colChange / numCols;

        let colNum = colDirection;
        while (moveNum < numCols) {
            if (targetIsOccupied([startCol + colNum, startRow])) {
                return false;
            }
            colNum += colDirection;
            moveNum += 1;
        }
    }

    return !targetIsOccupied(target, piece.colour);
}

function noDiagonalObstruction(target, piece, rowChange, colChange) {
    const [startCol, startRow] = piece.position;
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

    return !targetIsOccupied(target, piece.colour);
}

function castleHasMoved(castleRow, castleColumn) {
    const cornerPiece = playingPieces.filter((playingPiece) => {
        const [col, row] = playingPiece.position;
        return col === castleColumn && row === castleRow;
    });

    if (cornerPiece.length === 1) {
        return (cornerPiece[0].type !== 'rook' || cornerPiece[0].hasMoved);
    }

    return true;
}

function isValidCastle(rowChange, colChange, playingPiece) {
    const [col, row] = playingPiece.position;
    const castleColumn = colChange > 0 ? 7 : 0;
    if (playingPiece.hasMoved || castleHasMoved(row, castleColumn)) {
        return false;
    }

    const columnsToCastle = castleColumn - col;
    const targetPosition = [playingPiece.position[0] + colChange, row];
    return noStraightObstruction(targetPosition, playingPiece, rowChange, columnsToCastle);
}

function validKingMove(rowChange, colChange, playingPiece) {
    const castlingMove = Math.abs(rowChange) === 0 && Math.abs(colChange) === 2;
    if (castlingMove) {
        return isValidCastle(rowChange, colChange, playingPiece);
    }

    const standardMove = Math.abs(rowChange) <= 1 && Math.abs(colChange) <= 1;
    return standardMove;
}

function validQueenMove(rowChange, colChange, playingPiece) {
    const [col, row] = playingPiece.position;
    const target = [col + colChange, row + rowChange];

    const isDiagonal = Math.abs(rowChange) === Math.abs(colChange);
    if (isDiagonal) {
        return noDiagonalObstruction(target, playingPiece, rowChange, colChange);
    }

    const isStraight = rowChange === 0 || colChange === 0;
    if (isStraight) {
        return noStraightObstruction(target, playingPiece, rowChange, colChange);
    }

    return false;
}

function validRookMove(rowChange, colChange, playingPiece) {
    if (rowChange !== 0 && colChange !== 0) {
        return false;
    }

    const [col, row] = playingPiece.position;
    const targetPosition = [col + colChange, row + rowChange];
    return noStraightObstruction(targetPosition, playingPiece, rowChange, colChange);
}

function validBishopMove(rowChange, colChange, playingPiece) {
    if (Math.abs(rowChange) !== Math.abs(colChange)) {
        return false;
    }

    const [col, row] = playingPiece.position;
    const targetPosition = [col + colChange, row + rowChange];
    return noDiagonalObstruction(targetPosition, playingPiece, rowChange, colChange);
}

function validKnightMove(rowChange, colChange) {
    const validMoveOne = Math.abs(rowChange) === 2 && Math.abs(colChange) === 1;
    const validMoveTwo = Math.abs(rowChange) === 1 && Math.abs(colChange) === 2;

    return validMoveOne || validMoveTwo;
}

function validPawnSpecialMove(rowChange, colChange, playingPiece) {
    const currentPosition = playingPiece.position;
    const targetPosition = [currentPosition[0], currentPosition[1] + rowChange];
    const isFirstMove = !playingPiece.hasMoved;
    const isObstructed = noStraightObstruction(targetPosition, playingPiece, rowChange, colChange);

    return (isFirstMove && isObstructed);
}

function validPawnMove(rowChange, colChange, piece) {
    const playingPiece = getPieceFromId(piece.id);
    const correctDirection = (piece.colour === 'white' && rowChange < 0) || (piece.colour === 'black' && rowChange > 0);

    const twoRowMove = colChange === 0 && Math.abs(rowChange) === 2;
    if (twoRowMove && correctDirection) {
        return validPawnSpecialMove(rowChange, colChange, playingPiece);
    }

    const oneRowMove = colChange === 0 && Math.abs(rowChange) === 1;
    if (oneRowMove && correctDirection) {
        const targetPosition = [playingPiece.position[0], playingPiece.position[1] + rowChange];
        return !targetIsOccupied(targetPosition);
    }

    const diagonalMove = Math.abs(colChange) === 1 && Math.abs(rowChange) === 1;
    if (diagonalMove && correctDirection) {
        const [col, row] = playingPiece.position;
        const targetPosition = [col + colChange, row + rowChange];
        const opponentColour = playingPiece.colour === 'white' ? 'black' : 'white';
        return targetIsOccupied(targetPosition, opponentColour);
    }

    return false;
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
    const piece = getPieceFromId(pieceId);
    if (piece) {
        return isValidMove(newPosition, piece);
    }

    return false;
}

export { observe, movePiece, canMovePiece };
