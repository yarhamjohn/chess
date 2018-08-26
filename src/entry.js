import React from 'react';
import ReactDOM from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import Board from './components/Board';
import { observe } from './shared/game';

const render = () => {
    const rootEl = document.getElementById('App');
    observe(pieces => 
        ReactDOM.render(
            <AppContainer>
                <Board pieces={pieces} />
            </AppContainer>, 
            rootEl
        )
    );
}

render();

if (module.hot) {
  module.hot.accept(render);
}