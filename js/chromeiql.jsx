import React from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from 'graphiql';
import _ from 'lodash';
import $ from 'jquery';

// Shortcut for React.createElement...
let rc = _.partial(React.createElement);

// Parse the search string to get url parameters.
let search = window.location.search;
let parameters = {};
search.substr(1).split('&').forEach(function (entry) {
  let eq = entry.indexOf('=');
  if (eq >= 0) {
    parameters[decodeURIComponent(entry.slice(0, eq))] =
      decodeURIComponent(entry.slice(eq + 1));
  }
});

// if variables was provided, try to format it.
if (parameters.variables) {
  try {
    parameters.variables =
      JSON.stringify(JSON.parse(parameters.variables), null, 2);
  } catch (e) {
    // Do nothing, we want to display the invalid JSON as a string, rather
    // than present an error.
  }
}

// When the query and variables string is edited, update the URL bar so
// that it can be easily shared
function onEditQuery(newQuery) {
  parameters.query = newQuery;
  updateURL();
}

function onEditVariables(newVariables) {
  parameters.variables = newVariables;
  updateURL();
}

function updateURL() {
  let newSearch = '?' + Object.keys(parameters).map(function (key) {
    return encodeURIComponent(key) + '=' +
      encodeURIComponent(parameters[key]);
  }).join('&');
  history.replaceState(null, null, newSearch);
}

// Defines a GraphQL fetcher using the fetch API.
function graphQLFetcher(endpoint) {
  return function(graphQLParams) {
    return fetch(endpoint, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphQLParams),
      credentials: 'include',
    }).then(response => response.json());
  }
}

class ChromeiQL extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentEndpoint: null,
      newEndpoint: this.props.endpoint
    };

    this.updateEndpointState = this.updateEndpointState.bind(this)
    this.setEndpoint = this.setEndpoint.bind(this)
    this.updateEndpoint = this.updateEndpoint.bind(this)
  }

  render() {
    const endpoint = this.state.currentEndpoint || this.state.newEndpoint;
    let graphqlConsole = null;
    if (endpoint) {
      graphqlConsole =
        <GraphiQL
          id = "graphiql"
          fetcher = {graphQLFetcher(endpoint)}
          query = {parameters.query}
          variables = {parameters.variables}
          onEditQuery = {onEditQuery}
          onEditVariables = {onEditVariables} />;
    }

    if (this.state.newEndpoint) {
      setTimeout(this.updateEndpointState, 500);
    }

    return (
      <div id = "application">
        <div id="url-bar" className="graphiql-container" >
          <input type="text" id="url-box" defaultValue={endpoint} onChange={this.updateEndpoint} />
          <a id="url-save-button" className="toolbar-button" onClick={this.setEndpoint}>
            Set endpoint
          </a>
        </div>
        { graphqlConsole }
      </div>
    );
  }

  updateEndpointState() {
    this.setState({
      currentEndpoint: this.state.newEndpoint,
      newEndpoint: null
    });
    $('button.execute-button').click();
  }

  setEndpoint() {
    let newEndpoint = window.chromeiqlEndpoint;
    let setState = this.setState.bind(this);
    chrome.storage.local.set(
      {"chromeiqlEndpoint": newEndpoint},
      function () {
        if (!chrome.runtime.lastError) {
          setState({ newEndpoint: newEndpoint });
        }
      }
    );
  }

  updateEndpoint(e) {
    window.chromeiqlEndpoint = e.target.value;
  }
}

chrome.storage.local.get("chromeiqlEndpoint", function(storage) {
  // Render <GraphiQL /> into the body.
  ReactDOM.render(
    rc(ChromeiQL, { endpoint: storage.chromeiqlEndpoint }),
    document.body
  );
});
