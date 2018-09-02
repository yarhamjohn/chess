import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Board from './components/board';
import { observe } from './shared/game';

const render = () => {
    const rootEl = document.getElementById('App');
    observe((pieces, currentPlayer) =>
        ReactDOM.render(
            <AppContainer>
                <Board pieces={pieces} currentPlayer={currentPlayer} />
            </AppContainer>,
            rootEl
        )
    );
}

render();

if (module.hot) {
  module.hot.accept(render);
}
