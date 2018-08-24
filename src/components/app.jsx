import React from 'react';
import Square from './square';
import Knight from './knight';

export default class App extends React.Component {
  render() {
    return (
      <Square black>
          <Knight />
      </Square>
    );
  }
}
