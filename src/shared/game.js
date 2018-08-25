let knightPosition = [1, 7];
let observer = null;

function emitChange() {
    observer(knightPosition);
}

export function observe(o) {
    if (observer) {
        throw new Error('Multiple observers not implemented');
    }
    observer = o;
    emitChange();
}

export function movePiece(toCol, toRow, type) {
    knightPosition = [toCol, toRow];
    emitChange();
}

export function canMovePiece(toCol, toRow, type) {
    const [col, row] = knightPosition;
    const rowChange = toRow - row;
    const colChange = toCol - col;

    const validMoveOne = Math.abs(rowChange) === 2 && Math.abs(colChange) === 1;
    const validMoveTwo = Math.abs(rowChange) === 1 && Math.abs(colChange) === 2;

    return validMoveOne || validMoveTwo;
}