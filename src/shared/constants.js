export const Pieces = {
    WHITE_KING: {
        type: 'king',
        icon: '♔',
        colour: 'white',
        startingPositions: [[4, 7]]
    },
    BLACK_KING: {
        type: 'king',
        icon: '♚',
        colour: 'black',
        startingPositions: [[4, 0]]
    },
    WHITE_QUEEN: {
        type: 'queen',
        icon: '♕',
        colour: 'white',
        startingPositions: [[3, 7]]
    },
    BLACK_QUEEN: {
        type: 'queen',
        icon: '♛',
        colour: 'black',
        startingPositions: [[3, 0]]
    },
    WHITE_ROOK: {
        type: 'rook',
        icon: '♖',
        colour: 'white',
        startingPositions: [[0, 7], [7, 7]]
    },
    BLACK_ROOK: {
        type: 'rook',
        icon: '♜',
        colour: 'black',
        startingPositions: [[0, 0], [7, 0]]
    },
    WHITE_BISHOP: {
        type: 'bishop',
        icon: '♗',
        colour: 'white',
        startingPositions: [[2, 7], [5, 7]]
    },
    BLACK_BISHOP: {
        type: 'bishop',
        icon: '♝',
        colour: 'black',
        startingPositions: [[2, 0], [5, 0]]
    },
    WHITE_KNIGHT: {
        type: 'knight',
        icon: '♘',
        colour: 'white',
        startingPositions: [[1, 7], [6, 7]]
    },
    BLACK_KNIGHT: {
        type: 'knight',
        icon: '♞',
        colour: 'black',
        startingPositions: [[1, 0], [6, 0]]
    },
    WHITE_PAWN: {
        type: 'pawn',
        icon: '♙',
        colour: 'white',
        startingPositions: [[0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6]]
    },
    BLACK_PAWN: {
        type: 'pawn',
        icon: '♟',
        colour: 'black',
        startingPositions: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1]]
    }
};

export const PieceTypes = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];
