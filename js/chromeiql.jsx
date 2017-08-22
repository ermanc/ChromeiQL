import React from 'react';
import ReactDOM from 'react-dom';
import GraphiQL from 'graphiql';
import _ from 'lodash';
import $ from 'jquery';

// Buffer for endpoint entry value
let chromeiqlEndpoint;

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
      prevEndpoint: null,
      currEndpoint: this.props.endpoint,
    };

    this.setEndpoint = this.setEndpoint.bind(this)
    this.updateEndpoint = this.updateEndpoint.bind(this)
  }

  render() {
    const endpoint = this.state.currEndpoint
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

    // If we have changed endpoints just now...
    if (this.state.currEndpoint !== this.state.prevEndpoint) {
      // then we shall re-execute the query after render
      setTimeout(() => $('button.execute-button').click(), 500);
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

  setEndpoint() {
    const newEndpoint = chromeiqlEndpoint;
    const setState = this.setState.bind(this);
    const currState = this.state;

    chrome.storage.local.set(
      { "chromeiqlEndpoint": newEndpoint },
      () => {
        if (!chrome.runtime.lastError) {
          // Move current endpoint to previous, and set current endpoint to new.
          setState({
            prevEndpoint: currState.currEndpoint,
            currEndpoint: newEndpoint
          });
        }
      }
    );
  }

  updateEndpoint(e) {
    chromeiqlEndpoint = e.target.value;
  }
}

chrome.storage.local.get("chromeiqlEndpoint", function(storage) {
  // Render <GraphiQL /> into the body.
  ReactDOM.render(
    rc(ChromeiQL, { endpoint: storage.chromeiqlEndpoint }),
    document.body
  );
});
