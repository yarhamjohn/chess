import cloneDeep from 'clone-deep';
import { Pieces } from './constants';

let playingPieces = [];
let removedPieces = [];
let currentPlayer = 'white';
let observer = null;
let kingIsInCheck = false;
let winner = false;
let stalemate = false;
let promotion = false;

function reset() {
    observer = null;
    playingPieces = [];
    removedPieces = [];
}

function emitChange() {
    observer(playingPieces, currentPlayer, removedPieces, kingIsInCheck, winner, stalemate, promotion);
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
                    hasMoved: false,
                    vulnerableToEnPassant: false,
                    canEnPassant: false
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

function updateCanEnPassant(pieces, pieceToMove, canEnPassant) {
    const currentPieces = pieces;
    Object.keys(currentPieces).forEach((key) => {
        if (currentPieces[key].id === pieceToMove.id) {
            currentPieces[key].canEnPassant = canEnPassant;
        }
    });

    return currentPieces;
}

function updateVulnerableToEnPassant(pieces, pieceToMove, vulnerableToEnPassant) {
    const currentPieces = pieces;
    Object.keys(currentPieces).forEach((key) => {
        if (currentPieces[key].id === pieceToMove.id) {
            currentPieces[key].vulnerableToEnPassant = vulnerableToEnPassant;
        }
    });

    return currentPieces;
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

function promotePawn(promotionPiece) {
    let currentPieces = cloneDeep(playingPieces);
    let takenPieces = cloneDeep(removedPieces);

    let pawn = currentPieces.filter(piece => piece.type === 'pawn' && (piece.position[1] === 0 || piece.position[1] === 7));
    if (pawn.length === 0) {
        return;
    }
    pawn = pawn[0];

    const pieces = currentPieces.concat(takenPieces).filter(piece => piece.type === promotionPiece.type && piece.colour === promotionPiece.colour);
    const splitPieceId = pieces[0].id.split('_');
    const newQueen = cloneDeep(pieces)[0];
    newQueen.id = splitPieceId[0].concat('_', splitPieceId[1], '_', pieces.length);
    newQueen.position = pawn.position;
    newQueen.hasMoved = true;

    const updatedCurrentPieces = addPieceToBoard(currentPieces, newQueen);
    [currentPieces, takenPieces] = removePieceFromBoard(updatedCurrentPieces, takenPieces, pawn);

    playingPieces = currentPieces;
    removedPieces = takenPieces;

    updateGameState(currentPieces);
    emitChange();
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

function isEnPassantMove(currentPieces, newPosition, attackingPawn) {
    const vulnerablePawns = currentPieces.filter(piece => piece.vulnerableToEnPassant)
    if (vulnerablePawns.length === 0) {
        return false;
    }

    const vulnerablePawn = vulnerablePawns[0];
    const canEnPassant = attackingPawn.canEnPassant;
    const sameColumn = newPosition[0] === vulnerablePawn.position[0];
    const correctRow = attackingPawn.colour === 'white' ? newPosition[1] === vulnerablePawn.position[1] - 1 : newPosition[1] === vulnerablePawn.position[1] + 1;
    const targetsVulnerablePawn = sameColumn && correctRow;
    return canEnPassant || targetsVulnerablePawn;
}

function getEnPassantPawns(currentPieces, newPosition, pawnColour) {
    const opponentColour = pawnColour === 'white' ? 'black' : 'white';
    return currentPieces.filter(piece =>
        piece.type === 'pawn'
            && opponentColour
            && piece.position[1] === newPosition[1]
            && Math.abs(newPosition[0] - piece.position[0]) === 1
    );
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

    const enPassantMove = isEnPassantMove(currentPieces, newPosition, pieceToMove);
    if (enPassantMove) {
        const targetRow = pieceToMove.colour === 'white' ? newPosition[1] + 1 : newPosition[1] - 1;
        const vulnerablePawn = getPieceFromPosition(currentPieces, [newPosition[0], targetRow]);

        currentPieces = updateCanEnPassant(currentPieces, pieceToMove, false);
        vulnerablePawn.vulnerableToEnPassant = false;
        [currentPieces, takenPieces] = removePieceFromBoard(currentPieces, takenPieces, vulnerablePawn);
    }

    const rowChange = Math.abs(pieceToMove.position[1] - newPosition[1]);
    const isPawnSpecialMove = pieceToMove.type === 'pawn' && rowChange === 2;
    if (isPawnSpecialMove) {
        const enPassantPawns = getEnPassantPawns(currentPieces, newPosition, pieceToMove.colour);
        if (enPassantPawns.length > 0) {
            for (let i = 0; i < enPassantPawns.length; i += 1) {
                currentPieces = updateCanEnPassant(currentPieces, enPassantPawns[i], true);
            }

            updateVulnerableToEnPassant(currentPieces, pieceToMove, true);
        }
    }

    const targetContainsOpponent = targetIsOccupied(currentPieces, newPosition, opponentColour);
    if (targetContainsOpponent) {
        const targetPiece = getPieceFromPosition(currentPieces, newPosition);
        targetPiece.hasMoved = true;
        [currentPieces, takenPieces] = removePieceFromBoard(currentPieces, takenPieces, targetPiece);
    }

    currentPieces = updatePiecePosition(currentPieces, newPosition, pieceToMove);

    return [currentPieces, takenPieces];
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
    const kingInCheck = inCheck(currentPieces, playingPiece.position, playingPiece.colour);
    if (castlingMove && !kingInCheck) {
        const targetSquare = colChange > 0 ? [playingPiece.position[0] + 1, playingPiece.position[1]] : [playingPiece.position[0] - 1, playingPiece.position[1]];
        const castleSquareIsAttacked = inCheck(currentPieces, targetSquare, playingPiece.colour);
        if (!castleSquareIsAttacked) {
            return isValidCastle(currentPieces, rowChange, colChange, playingPiece);
        }
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
        return targetIsOccupied(currentPieces, targetPosition, opponentColour) || isEnPassantMove(currentPieces, targetPosition, playingPiece);
    }

    return false;
}

function isCheckingPiece(pieceToCheck, targetPosition, targetColour) {
    const [pieceCol, pieceRow] = pieceToCheck.position;
    const [kingCol, kingRow] = targetPosition;
    const absColChange = Math.abs(kingCol - pieceCol);
    const absRowChange = Math.abs(kingRow - pieceRow);

    const sameRowOrColumn = kingCol === pieceCol || kingRow === pieceRow;
    if (sameRowOrColumn && (pieceToCheck.type === 'rook' || pieceToCheck.type === 'queen')) {
        return true;
    }

    const diagonalMove = absColChange === absRowChange;
    if (diagonalMove && (pieceToCheck.type === 'bishop' || pieceToCheck.type === 'queen')) {
        return true;
    }

    const kingMove = (absColChange <= 1 && absRowChange <= 1 && !(absColChange === 0 && absRowChange === 0));
    if (pieceToCheck.type === 'king' && kingMove) {
        return true;
    }

    const pawnRow = targetColour === 'white' ? kingRow - 1 : kingRow + 1;
    if (pieceToCheck.type === 'pawn' && pieceRow === pawnRow && (pieceCol === kingCol + 1 || pieceCol === kingCol - 1)) {
        return true;
    }

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

function inCheck(currentPieces, targetPosition, targetColour) {
    const [possibleMoves, positionsToCheck] = getInitialPositionsToCheck(targetPosition);

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
            } else if (pieceToCheck.colour === targetColour) {
                positionsToCheck.splice(i, 1);
                possibleMoves.splice(i, 1);
            } else {
                const pieceIsChecking = isCheckingPiece(pieceToCheck, targetPosition, targetColour);
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
        let king = getKing(currentPieces, piece.colour);

        const [updatedPieces, _] = performMove(newPosition, piece);
        if (piece.type === 'king') {
            const movedKing = getPieceFromId(updatedPieces, piece.id);
            king = movedKing;
        }

        const leftInCheck = inCheck(updatedPieces, king.position, king.colour);
        return !leftInCheck;
    }

    return false;
}

function canMovePiece(newPosition, pieceId) {
    const piece = getPieceFromId(playingPieces, pieceId);
    if (piece && piece.colour === currentPlayer) {
        return isValidMove(newPosition, piece) && !promotion;
    }

    return false;
}

function noValidMovesRemaining(currentPieces, colour) {
    const teamPieces = currentPieces.filter(piece => piece.colour === colour);

    let numMoveablePieces = 0;
    for (let col = 0; col <= 7; col += 1) {
        for (let row = 0; row <= 7; row += 1) {
            for (let i = 0; i < teamPieces.length; i += 1) {
                const pieceCanMove = isValidMove([col, row], teamPieces[i]);
                if (pieceCanMove) {
                    numMoveablePieces += 1;
                }
            }
        }
    }

    return numMoveablePieces === 0;
}

function winIsImpossible(currentPieces) {
    const blackPieces = currentPieces.filter(piece => piece.colour === 'black' && piece.type !== 'king');
    const whitePieces = currentPieces.filter(piece => piece.colour === 'white' && piece.type !== 'king');
    const numBlackPieces = blackPieces.length;
    const numWhitePieces = whitePieces.length;

    const onlyKingsLeft = numBlackPieces === 0 && numWhitePieces === 0;
    const onlyOneKnight = (numBlackPieces === 0 && numWhitePieces === 1 && whitePieces[0].type === 'knight') || (numBlackPieces === 1 && blackPieces[0].type === 'knight' && numWhitePieces === 0);
    const onlyOneBishop = (numBlackPieces === 0 && numWhitePieces === 1 && whitePieces[0].type === 'bishop') || (numBlackPieces === 1 && blackPieces[0].type === 'bishop' && numWhitePieces === 0);
    return onlyKingsLeft || onlyOneBishop || onlyOneKnight;
}

function updateGameState(currentPieces) {
    promotion = false;
    changePlayer();
    const king = getKing(currentPieces, currentPlayer);
    kingIsInCheck = inCheck(currentPieces, king.position, king.colour);
    const noValidMoves = noValidMovesRemaining(currentPieces, currentPlayer);
    if (kingIsInCheck) {
        winner = noValidMoves;
    }

    const gameCannotBeWon = winIsImpossible(currentPieces);
    stalemate = noValidMoves || gameCannotBeWon;
}

function movePiece(newPosition, pieceId) {
    const pieceToMove = getPieceFromId(playingPieces, pieceId);
    const [currentPieces, takenPieces] = performMove(newPosition, pieceToMove);

    playingPieces = currentPieces;
    removedPieces = takenPieces;

    const endRow = newPosition[1] === 0 || newPosition[1] === 7;
    const pawnReachedEnd = pieceToMove.type === 'pawn' && endRow;
    if (pawnReachedEnd) {
        promotion = true;
        emitChange();
        return;
    }

    updateGameState(currentPieces);
    emitChange();
}

export { observe, movePiece, canMovePiece, promotePawn };
