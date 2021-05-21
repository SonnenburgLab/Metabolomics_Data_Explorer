import React from 'react';
import './App.css';
import { HashRouter as Router, Route, NavLink } from "react-router-dom";
import InVitro from './InVitro.js';
import InVivo from './InVivo.js';

const App = props => {
  return (
    <Router>
      <nav>
        <span className="home">
          Metabolomics Data Explorer
        </span>
        <ul>
          <li>
            <NavLink to="/" exact activeClassName="active">In vitro</NavLink>
          </li>
          <li>
            <NavLink to="/invivo" exact activeClassName="active">In vivo</NavLink>
          </li>
        </ul>
      </nav>
      <Route path="/" exact component={InVitro} />
      <Route path="/invivo" exact component={InVivo} />

    </Router>
  );
}

export default App;
