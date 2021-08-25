import React from 'react'
import { AppProps } from './interfaces';

const App: React.FC<AppProps> = props => {
  return <h1>{props.title}</h1>
}

export default App;
