import { Pieces } from './constants';

let playingPieces = [];
let removedPieces = [];
let currentPlayer = 'white';
let observer = null;

function reset() {
    observer = null;
    playingPieces = [];
    removedPieces = [];
}

function emitChange() {
    observer(playingPieces, currentPlayer, removedPieces);
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

function updatePiecePosition(pieces, newPosition, pieceToMove) {
    const currentPieces = pieces;
    Object.keys(currentPieces).forEach((key) => {
        if (currentPieces[key].id === pieceToMove.id) {
            currentPieces[key].position = newPosition;
            currentPieces[key].hasMoved = true;
        }
    });

    return currentPieces;
}

function addPieceToBoard(currentPieces, piece) {
    currentPieces.push(piece);
    return currentPieces;
}

function removePieceFromBoard(currentPieces, takenPieces, piece) {
    const updatedCurrentPieces = currentPieces.filter(playingPiece => playingPiece.id !== piece.id);
    takenPieces.push(piece);
    return [updatedCurrentPieces, takenPieces];
}

function getPieceFromId(currentPieces, pieceId) {
    return currentPieces.find(piece => piece.id === pieceId);
}

function getPieceFromPosition(currentPieces, piecePosition) {
    return currentPieces.find(piece =>
        piece.position[0] === piecePosition[0] && piece.position[1] === piecePosition[1]
    );
}

function promotePawn(currentPieces, takenPieces, newPosition, pawn) {
    const queens = playingPieces.concat(removedPieces).filter(piece => piece.type === 'queen' && piece.colour === pawn.colour);
    const splitQueenId = queens[0].id.split('_');
    const newQueen = queens[0];
    newQueen.id = splitQueenId[0].concat('_', splitQueenId[1], '_', queens.length);
    newQueen.position = newPosition;
    newQueen.hasMoved = true;

    const updatedCurrentPieces = addPieceToBoard(currentPieces, newQueen);
    return removePieceFromBoard(updatedCurrentPieces, takenPieces, pawn);
}

function performCastle(currentPieces, pieceToMove, newPosition) {
    const rookCol = pieceToMove.position[0] - newPosition[0] > 0 ? 0 : 7;
    const rookToCastle = getPieceFromPosition(currentPieces, [rookCol, newPosition[1]]);
    const rookDirection = rookToCastle.position[0] - newPosition[0] > 0 ? -1 : 1;
    const newRookPosition = [newPosition[0] + rookDirection, rookToCastle.position[1]];
    const pieces = updatePiecePosition(currentPieces, newRookPosition, rookToCastle);
    return updatePiecePosition(pieces, newPosition, pieceToMove);
}

function targetIsOccupied(currentPieces, targetPosition, pieceColour = null) {
    const targetPiece = currentPieces.find((piece) => {
        const [fromCol, fromRow] = piece.position;
        const [targetCol, targetRow] = targetPosition;

        return fromCol === targetCol && fromRow === targetRow;
    });

    if (targetPiece && pieceColour) {
        return targetPiece.colour === pieceColour;
    }

    return targetPiece;
}

function changePlayer() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
}

function performMove(newPosition, pieceToMove) {
    let currentPieces = [...playingPieces];
    let takenPieces = [...removedPieces];
    
    const opponentColour = pieceToMove.colour === 'white' ? 'black' : 'white';

    const colChange = Math.abs(pieceToMove.position[0] - newPosition[0]);
    const castlingMove = pieceToMove.type === 'king' && colChange === 2;
    if (castlingMove) {
        currentPieces = performCastle(currentPieces, pieceToMove, newPosition);
        return [currentPieces, takenPieces];
    }

    const targetContainsOpponent = targetIsOccupied(currentPieces, newPosition, opponentColour);
    if (targetContainsOpponent) {
        const targetPiece = getPieceFromPosition(currentPieces, newPosition);
        targetPiece.hasMoved = true;
        [currentPieces, takenPieces] = removePieceFromBoard(currentPieces, takenPieces, targetPiece);
    }

    currentPieces = updatePiecePosition(currentPieces, newPosition, pieceToMove);

    const endRow = newPosition[1] === 0 || newPosition[1] === 7;
    const pawnReachedEnd = pieceToMove.type === 'pawn' && endRow;
    if (pawnReachedEnd) {
        [currentPieces, takenPieces] = promotePawn(currentPieces, takenPieces, newPosition, pieceToMove);
    }

    return [currentPieces, takenPieces];
}

function movePiece(newPosition, pieceId) {
    const pieceToMove = getPieceFromId(playingPieces, pieceId);
    const [currentPieces, takenPieces] = performMove(newPosition, pieceToMove);

    playingPieces = currentPieces;
    removedPieces = takenPieces;

    changePlayer();
    emitChange();
}

function noStraightObstruction(currentPieces, target, piece, rowChange, colChange) {
    const [startCol, startRow] = piece.position;

    let moveNum = 1;
    if (colChange === 0) {
        const numRows = Math.abs(rowChange);
        const rowDirection = rowChange / numRows;

        let rowNum = rowDirection;
        while (moveNum < numRows) {
            if (targetIsOccupied(currentPieces, [startCol, startRow + rowNum])) {
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
            if (targetIsOccupied(currentPieces, [startCol + colNum, startRow])) {
                return false;
            }
            colNum += colDirection;
            moveNum += 1;
        }
    }

    return !targetIsOccupied(currentPieces, target, piece.colour);
}

function noDiagonalObstruction(currentPieces, target, piece, rowChange, colChange) {
    const [startCol, startRow] = piece.position;
    const rowMoveDirection = rowChange / Math.abs(rowChange);
    const colMoveDirection = colChange / Math.abs(colChange);
    const diagonalDistance = Math.abs(colChange);

    let moveNum = 1;
    let colNum = colMoveDirection;
    let rowNum = rowMoveDirection;
    while (moveNum < diagonalDistance) {
        if (targetIsOccupied(currentPieces, [startCol + colNum, startRow + rowNum])) {
            return false;
        }
        rowNum += rowMoveDirection;
        colNum += colMoveDirection;
        moveNum += 1;
    }

    return !targetIsOccupied(currentPieces, target, piece.colour);
}

function castleHasMoved(currentPieces, castleRow, castleColumn) {
    const cornerPiece = currentPieces.filter((playingPiece) => {
        const [col, row] = playingPiece.position;
        return col === castleColumn && row === castleRow;
    });

    if (cornerPiece.length === 1) {
        return (cornerPiece[0].type !== 'rook' || cornerPiece[0].hasMoved);
    }

    return true;
}

function isValidCastle(currentPieces, rowChange, colChange, playingPiece) {
    const [col, row] = playingPiece.position;
    const castleColumn = colChange > 0 ? 7 : 0;
    if (playingPiece.hasMoved || castleHasMoved(currentPieces, row, castleColumn)) {
        return false;
    }

    const columnsToCastle = castleColumn - col;
    const targetPosition = [playingPiece.position[0] + colChange, row];
    return noStraightObstruction(currentPieces, targetPosition, playingPiece, rowChange, columnsToCastle);
}

function validKingMove(currentPieces, rowChange, colChange, playingPiece) {
    const castlingMove = Math.abs(rowChange) === 0 && Math.abs(colChange) === 2;
    if (castlingMove) {
        return isValidCastle(currentPieces, rowChange, colChange, playingPiece);
    }

    const standardMove = Math.abs(rowChange) <= 1 && Math.abs(colChange) <= 1;
    return standardMove;
}

function validQueenMove(currentPieces, rowChange, colChange, playingPiece) {
    const [col, row] = playingPiece.position;
    const target = [col + colChange, row + rowChange];

    const isDiagonal = Math.abs(rowChange) === Math.abs(colChange);
    if (isDiagonal) {
        return noDiagonalObstruction(currentPieces, target, playingPiece, rowChange, colChange);
    }

    const isStraight = rowChange === 0 || colChange === 0;
    if (isStraight) {
        return noStraightObstruction(currentPieces, target, playingPiece, rowChange, colChange);
    }

    return false;
}

function validRookMove(currentPieces, rowChange, colChange, playingPiece) {
    if (rowChange !== 0 && colChange !== 0) {
        return false;
    }

    const [col, row] = playingPiece.position;
    const targetPosition = [col + colChange, row + rowChange];
    return noStraightObstruction(currentPieces, targetPosition, playingPiece, rowChange, colChange);
}

function validBishopMove(currentPieces, rowChange, colChange, playingPiece) {
    if (Math.abs(rowChange) !== Math.abs(colChange)) {
        return false;
    }

    const [col, row] = playingPiece.position;
    const targetPosition = [col + colChange, row + rowChange];
    return noDiagonalObstruction(currentPieces, targetPosition, playingPiece, rowChange, colChange);
}

function validKnightMove(rowChange, colChange) {
    const validMoveOne = Math.abs(rowChange) === 2 && Math.abs(colChange) === 1;
    const validMoveTwo = Math.abs(rowChange) === 1 && Math.abs(colChange) === 2;

    return validMoveOne || validMoveTwo;
}

function validPawnSpecialMove(currentPieces, rowChange, colChange, playingPiece) {
    const currentPosition = playingPiece.position;
    const targetPosition = [currentPosition[0], currentPosition[1] + rowChange];
    const isFirstMove = !playingPiece.hasMoved;
    const isObstructed = noStraightObstruction(currentPieces, targetPosition, playingPiece, rowChange, colChange);

    return (isFirstMove && isObstructed);
}

function validPawnMove(currentPieces, rowChange, colChange, piece) {
    const playingPiece = getPieceFromId(currentPieces, piece.id);
    const correctDirection = (piece.colour === 'white' && rowChange < 0) || (piece.colour === 'black' && rowChange > 0);

    const twoRowMove = colChange === 0 && Math.abs(rowChange) === 2;
    if (twoRowMove && correctDirection) {
        return validPawnSpecialMove(currentPieces, rowChange, colChange, playingPiece);
    }

    const oneRowMove = colChange === 0 && Math.abs(rowChange) === 1;
    if (oneRowMove && correctDirection) {
        const targetPosition = [playingPiece.position[0], playingPiece.position[1] + rowChange];
        return !targetIsOccupied(currentPieces, targetPosition);
    }

    const diagonalMove = Math.abs(colChange) === 1 && Math.abs(rowChange) === 1;
    if (diagonalMove && correctDirection) {
        const [col, row] = playingPiece.position;
        const targetPosition = [col + colChange, row + rowChange];
        const opponentColour = playingPiece.colour === 'white' ? 'black' : 'white';
        return targetIsOccupied(currentPieces, targetPosition, opponentColour);
    }

    return false;
}

function isInCheck() {
// copy list
// make move on copy

// set up list of all move directions
// set up list of all initial positions to check around the king

// while length of pos list is > 0
// for each pos
// get Piece
// if same team, remove pos and mvoe from lists
// if empty, increment pos by move unless pos is already at board edge in which case remove pos and move from lists
// if opponent call isCheckingPiece
// if true return true
// if false remove pos and move from list
}

function isCheckingPiece() {
// if same row or col and rook or queen return true
// if diagonal and bishop or queen return true
// if pawn and in specific places return true
// if knight and in specific places return true
// return false
}

function isValidMove(newPosition, piece) {
    const currentPieces = [...playingPieces];

    const rowChange = newPosition[1] - piece.position[1];
    const colChange = newPosition[0] - piece.position[0];

    const pieceUnmoved = rowChange === 0 && colChange === 0;
    const targetOccupiedByTeam = targetIsOccupied(currentPieces, newPosition, piece.colour);
    if (pieceUnmoved || targetOccupiedByTeam) {
        return false;
    }

    switch (piece.type) {
        case 'king':
            return validKingMove(currentPieces, rowChange, colChange, piece);
        case 'queen':
            return validQueenMove(currentPieces, rowChange, colChange, piece);
        case 'rook':
            return validRookMove(currentPieces, rowChange, colChange, piece);
        case 'bishop':
            return validBishopMove(currentPieces, rowChange, colChange, piece);
        case 'knight':
            return validKnightMove(rowChange, colChange);
        default:
            return validPawnMove(currentPieces, rowChange, colChange, piece);
    }
}

function canMovePiece(newPosition, pieceId) {
    const piece = getPieceFromId(playingPieces, pieceId);
    if (piece && piece.colour === currentPlayer) {
        return isValidMove(newPosition, piece);
    }

    return false;
}

export { observe, movePiece, canMovePiece };
