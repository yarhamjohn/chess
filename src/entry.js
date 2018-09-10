import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Board from './components/board';
import { observe } from './shared/game';

const render = () => {
    const rootEl = document.getElementById('App');
    observe((pieces, currentPlayer, removedPieces, kingIsInCheck, winner, stalemate, promotion) =>
        ReactDOM.render(
            <AppContainer>
                <Board pieces={pieces} currentPlayer={currentPlayer} removedPieces={removedPieces} inCheck={kingIsInCheck} gameWon={winner} stalemate={stalemate} promotion={promotion} />
            </AppContainer>,
            rootEl
        )
    );
}

render();

if (module.hot) {
  module.hot.accept(render);
}
