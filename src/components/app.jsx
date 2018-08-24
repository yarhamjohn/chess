import React from 'react';
import Board from './board';

export default class App extends React.Component {
  render() {
    return <Board knightPosition={[7, 4]} />;
  }
}
