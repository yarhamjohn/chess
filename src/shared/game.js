import cloneDeep from 'clone-deep';
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
    const queens = currentPieces.concat(takenPieces).filter(piece => piece.type === 'queen' && piece.colour === pawn.colour);
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

    return targetPiece === undefined ? false : targetPiece;
}

function changePlayer() {
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
}

function performMove(newPosition, pieceToMove) {
    let currentPieces = cloneDeep(playingPieces);
    let takenPieces = cloneDeep(removedPieces);
    
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

    if (piece.type === 'pawn') {
        return !targetIsOccupied(currentPieces, target);
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

function isCheckingPiece(pieceToCheck, king) {
    const [pieceCol, pieceRow] = pieceToCheck.position;
    const [kingCol, kingRow] = king.position;

    const sameRowOrColumn = kingCol === pieceCol || kingRow === pieceRow;
    if (sameRowOrColumn && (pieceToCheck.type === 'rook' || pieceToCheck.type === 'queen')) {
        return true;
    }

    const diagonalMove = Math.abs(kingCol - pieceCol) === Math.abs(kingRow - pieceRow);
    if (diagonalMove && (pieceToCheck.type === 'bishop' || pieceToCheck.type === 'queen')) {
        return true;
    }

    const pawnRow = king.colour === 'white' ? kingRow - 1 : kingRow + 1;
    if (pieceToCheck.type === 'pawn' && pieceRow === pawnRow && (pieceCol === kingCol + 1 || pieceCol === kingCol - 1)) {
        return true;
    }

    const absRowChange = Math.abs(kingRow - pieceRow);
    const absColChange = Math.abs(kingCol - pieceCol);
    const validMoveOne = (absRowChange === 1 && absColChange === 2);
    const validMoveTwo = (absRowChange === 2 && absColChange === 1);
    if (pieceToCheck.type === 'knight' && (validMoveOne || validMoveTwo)) {
        return true;
    }

    return false;
}

function getInitialPositionsToCheck(kingPosition) {
    const [kingCol, kingRow] = kingPosition;
    const possibleMoves = [];
    const positionsToCheck = [];

    for (let col = kingCol - 1; col <= kingCol + 1; col += 1) {
        const colIsOnBoard = col >= 0 && col <= 7;
        if (colIsOnBoard) {
            for (let row = kingRow - 1; row <= kingRow + 1; row += 1) {
                const rowIsOnBoard = row >= 0 && row <= 7;
                if (rowIsOnBoard) {
                    const isKingPosition = row === kingRow && col === kingCol;
                    if (!isKingPosition) {
                        possibleMoves.push([col - kingCol, row - kingRow]);
                        positionsToCheck.push([col, row]);
                    }
                }
            }
        }
    }

    return [possibleMoves, positionsToCheck];
}

function inCheck(king, newPosition, piece) {
    const [currentPieces, _] = performMove(newPosition, piece);

    let actualKing = king;
    if (piece.type === 'king') {
        const movedKing = getPieceFromId(currentPieces, piece.id);
        actualKing = movedKing;
    }
    const [possibleMoves, positionsToCheck] = getInitialPositionsToCheck(actualKing.position);

    let numPositions = positionsToCheck.length;
    while (numPositions > 0) {
        for (let i = numPositions - 1; i >= 0; i -= 1) {
            const pieceToCheck = getPieceFromPosition(currentPieces, positionsToCheck[i]);
            if (pieceToCheck === undefined) {
                const [colChange, rowChange] = possibleMoves[i];
                const [col, row] = positionsToCheck[i];

                const goesOffBoardLeft = (col === 0 && colChange === -1);
                const goesOffBoardRight = (col === 7 && colChange === 1);
                const goesOffBoardTop = (row === 0 && rowChange === -1);
                const goesOffBoardBottom = (row === 7 && rowChange === 1);
                if (goesOffBoardLeft || goesOffBoardRight || goesOffBoardTop || goesOffBoardBottom) {
                    positionsToCheck.splice(i, 1);
                    possibleMoves.splice(i, 1);
                } else {
                    const newPositionToCheck = [col + colChange, row + rowChange];
                    positionsToCheck[i] = newPositionToCheck;
                }
            } else if (pieceToCheck.colour === piece.colour) {
                positionsToCheck.splice(i, 1);
                possibleMoves.splice(i, 1);
            } else {
                const pieceIsChecking = isCheckingPiece(pieceToCheck, actualKing);
                if (pieceIsChecking) {
                    return true;
                }

                positionsToCheck.splice(i, 1);
                possibleMoves.splice(i, 1);
            }
        }

        numPositions = positionsToCheck.length;
    }

    return false;
}

function getKing(currentPieces, colour) {
    return currentPieces.filter(piece => piece.type === 'king' && piece.colour === colour)[0];
}

function isValidMove(newPosition, piece) {
    const currentPieces = cloneDeep(playingPieces);
    const rowChange = newPosition[1] - piece.position[1];
    const colChange = newPosition[0] - piece.position[0];

    const pieceUnmoved = rowChange === 0 && colChange === 0;
    const targetOccupiedByTeam = targetIsOccupied(currentPieces, newPosition, piece.colour);

    if (pieceUnmoved || targetOccupiedByTeam) {
        return false;
    }

    let validMove = false;
    switch (piece.type) {
        case 'king':
            validMove = validKingMove(currentPieces, rowChange, colChange, piece);
            break;
        case 'queen':
            validMove = validQueenMove(currentPieces, rowChange, colChange, piece);
            break;
        case 'rook':
            validMove = validRookMove(currentPieces, rowChange, colChange, piece);
            break;
        case 'bishop':
            validMove = validBishopMove(currentPieces, rowChange, colChange, piece);
            break;
        case 'knight':
            validMove = validKnightMove(rowChange, colChange);
            break;
        default:
            validMove = validPawnMove(currentPieces, rowChange, colChange, piece);

    }

    if (validMove) {
        const king = getKing(currentPieces, piece.colour);
        const leftInCheck = inCheck(king, newPosition, piece);
        return !leftInCheck;
    }

    return false;
}

function canMovePiece(newPosition, pieceId) {
    const piece = getPieceFromId(playingPieces, pieceId);
    if (piece && piece.colour === currentPlayer) {
        return isValidMove(newPosition, piece);
    }

    return false;
}

export { observe, movePiece, canMovePiece };
