import React from 'react';
import {render} from 'react-dom';
import { Router, Route, indexRoute, browserHistory } from 'react-router';
import createBrowserHistory from 'history/lib/createBrowserHistory';
import Main from './components/main/main';
import Signup from './components/signup/signup';
import Login from './components/login/login';
import Dashboard from './components/dashboard/dashboard';
import Documents from './components/documents/documents';
import SearchBox from './components/searchDocs/searchDocs.js';
import DocumentDetail from './components/documentDetail/documentDetail';
import initialState from './store/initialState'
import { Provider } from 'react-redux';
import store from './store/configureStore'
import './styles/styles.css';

// let store = configureStore(initialState);

 render (
  <Provider store={store}>
    <Router history={browserHistory}>
      <Route path="/" component={Main} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/documents" component={Documents} />
      <Route path="/documents/:id" component={DocumentDetail} />
      <Route path="/search/documents" component={SearchBox} />
    </Router> 
  </Provider>,
  document.getElementById('app'));